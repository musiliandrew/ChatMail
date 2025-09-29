import asyncio
import json
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from jose import jwt
from app.core.config import settings
from app.services.redis_client import get_redis

router = APIRouter()

# Simple connection manager per user (by email subject)
connections: Dict[str, Set[WebSocket]] = {}


def authenticate_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token")
        return sub
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, token: str = Query(...)):
    subject = authenticate_token(token)
    await websocket.accept()

    # Register connection
    conns = connections.setdefault(subject, set())
    conns.add(websocket)

    # Start Redis pubsub listener
    redis = get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe("events:typing", "events:receipts")

    async def reader():
        async for msg in pubsub.listen():
            if msg is None:
                continue
            if msg.get("type") != "message":
                continue
            try:
                data = json.loads(msg.get("data"))
            except Exception:
                continue
            # Forward all for now; client filters by conversation_id
            try:
                await websocket.send_json(data)
            except Exception:
                break

    reader_task = asyncio.create_task(reader())

    try:
        while True:
            # keepalive: receive pings if any; sleep to yield control
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass
    finally:
        reader_task.cancel()
        try:
            await pubsub.unsubscribe()
        except Exception:
            pass
        conns = connections.get(subject)
        if conns and websocket in conns:
            conns.remove(websocket)
