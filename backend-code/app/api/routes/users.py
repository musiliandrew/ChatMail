from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import User, Invite

router = APIRouter()

@router.get("/exists")
async def user_exists(email: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    return {"exists": user is not None}

@router.post("/invites")
async def create_invite(email: str, inviter_user_id: str | None = None, db: AsyncSession = Depends(get_db)):
    # idempotent: if invite exists and pending, return ok
    res = await db.execute(select(Invite).where(Invite.email == email))
    invite = res.scalar_one_or_none()
    if invite and invite.status == "pending":
        return {"status": "pending"}
    from secrets import token_urlsafe
    inv = invite or Invite(email=email)
    inv.token = token_urlsafe(32)
    inv.status = "pending"
    if inviter_user_id:
        import uuid
        try:
            inv.inviter_user_id = uuid.UUID(inviter_user_id)
        except Exception:
            pass
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    # TODO: send email via provider
    return {"status": "created", "token": inv.token}
