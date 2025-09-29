import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import Conversation, ConversationParticipant, User
from app.schemas.common import ConversationOut, CreateConversationIn

router = APIRouter()

@router.get("/", response_model=list[ConversationOut])
async def list_conversations(user_id: str | None = None, db: AsyncSession = Depends(get_db)):
    # MVP: return all conversations if no user filter
    res = await db.execute(select(Conversation).order_by(Conversation.created_at.desc()))
    rows = res.scalars().all()
    return rows

@router.post("/", response_model=ConversationOut)
async def create_conversation(payload: CreateConversationIn, creator_user_id: str | None = None, db: AsyncSession = Depends(get_db)):
    convo = Conversation(subject=payload.subject)
    db.add(convo)
    await db.flush()

    # Add participants: if user exists, use user_id, else external_email
    for email in payload.participants:
        res = await db.execute(select(User).where(User.email == email))
        user = res.scalar_one_or_none()
        part = ConversationParticipant(
            conversation_id=convo.id,
            user_id=user.id if user else None,
            external_email=None if user else email,
        )
        db.add(part)

    await db.commit()
    await db.refresh(convo)
    return convo


@router.get("/{conversation_id}/participants")
async def get_participants(conversation_id: str, db: AsyncSession = Depends(get_db)):
    try:
        convo_uuid = uuid.UUID(conversation_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation id")
    res = await db.execute(select(ConversationParticipant).where(ConversationParticipant.conversation_id == convo_uuid))
    parts = res.scalars().all()
    # return emails (registered users by email + external_email)
    emails: list[str] = []
    for p in parts:
        if p.user_id:
            ures = await db.execute(select(User).where(User.id == p.user_id))
            u = ures.scalar_one_or_none()
            if u and u.email:
                emails.append(u.email)
        elif p.external_email:
            emails.append(p.external_email)
    return {"emails": emails}
