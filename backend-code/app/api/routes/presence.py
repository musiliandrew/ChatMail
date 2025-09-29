from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import User, Message
from app.services.auth import get_current_subject
from app.services.redis_client import get_redis, publish

router = APIRouter()


class HeartbeatOut(BaseModel):
    ok: bool
    now: datetime


@router.post("/presence/heartbeat", response_model=HeartbeatOut)
async def presence_heartbeat(subject: str = Depends(get_current_subject), db: AsyncSession = Depends(get_db)):
    # mark online in redis with TTL and update last_seen in DB
    r = get_redis()
    now = datetime.now(timezone.utc)
    await r.setex(f"presence:{subject}", 60, "online")
    await r.set(f"last_seen:{subject}", now.isoformat())
    # update DB last_seen
    res = await db.execute(select(User).where(User.email == subject))
    user = res.scalar_one_or_none()
    if user:
        user.last_seen = now
        db.add(user)
        await db.commit()
    return HeartbeatOut(ok=True, now=now)


@router.get("/presence/last-seen")
async def get_last_seen(user_email: str):
    r = get_redis()
    last = await r.get(f"last_seen:{user_email}")
    online = await r.get(f"presence:{user_email}") == "online"
    return {"online": online, "last_seen": last}


class TypingIn(BaseModel):
    conversation_id: str
    typing: bool


@router.post("/typing")
async def set_typing(payload: TypingIn, subject: str = Depends(get_current_subject)):
    r = get_redis()
    key = f"typing:{payload.conversation_id}:{subject}"
    if payload.typing:
        await r.setex(key, 5, "1")  # 5s TTL
    else:
        await r.delete(key)
    # broadcast event
    await publish("events:typing", {"conversation_id": payload.conversation_id, "user": subject, "typing": payload.typing})
    return {"ok": True}


class ReceiptsIn(BaseModel):
    conversation_id: str
    message_ids: list[str]


@router.post("/receipts/delivered")
async def receipts_delivered(payload: ReceiptsIn, db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Message)
        .where(Message.id.in_(payload.message_ids))
        .values(status="delivered")
    )
    await db.commit()
    await publish("events:receipts", {"conversation_id": payload.conversation_id, "message_ids": payload.message_ids, "status": "delivered"})
    return {"ok": True}


@router.post("/receipts/read")
async def receipts_read(payload: ReceiptsIn, db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(Message)
        .where(Message.id.in_(payload.message_ids))
        .values(status="read")
    )
    await db.commit()
    await publish("events:receipts", {"conversation_id": payload.conversation_id, "message_ids": payload.message_ids, "status": "read"})
    return {"ok": True}
