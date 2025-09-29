import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import Message, Conversation
from app.schemas.common import MessageOut, CreateMessageIn

router = APIRouter()

@router.get("/{conversation_id}", response_model=list[MessageOut])
async def list_messages(conversation_id: str, db: AsyncSession = Depends(get_db)):
    try:
        convo_uuid = uuid.UUID(conversation_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation id")
    res = await db.execute(select(Message).where(Message.conversation_id == convo_uuid).order_by(Message.created_at.asc()))
    rows = res.scalars().all()
    return rows

@router.post("/{conversation_id}", response_model=MessageOut)
async def send_message(conversation_id: str, payload: CreateMessageIn, sender_user_id: str | None = None, db: AsyncSession = Depends(get_db)):
    try:
        convo_uuid = uuid.UUID(conversation_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation id")

    res = await db.execute(select(Conversation).where(Conversation.id == convo_uuid))
    convo = res.scalar_one_or_none()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = Message(
        conversation_id=convo.id,
        sender_user_id=uuid.UUID(sender_user_id) if sender_user_id else None,
        body_text=payload.text,
        direction="outbound",
        status="sent",
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    # TODO: trigger Gmail send and WebSocket pub
    return msg
