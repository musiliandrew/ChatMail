from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.db.models import User
from app.core.config import settings
from app.services.auth import create_access_token, get_current_subject

router = APIRouter()

SCOPES = [
    "openid",
    "email",
    "profile",
]

def _google_auth_url(state: str = "state") -> str:
    base = "https://accounts.google.com/o/oauth2/v2/auth"
    from urllib.parse import urlencode
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{base}?{urlencode(params)}"


@router.get("/google/start")
async def google_start():
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    return {"url": _google_auth_url()}


@router.get("/google/callback")
async def google_callback(
    code: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or not settings.GOOGLE_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    # Exchange code for tokens
    import httpx
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        token_res = await client.post("https://oauth2.googleapis.com/token", data=data)
        if token_res.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to exchange code")
        tokens = token_res.json()
        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(status_code=401, detail="No access token from Google")

        # Fetch userinfo
        userinfo_res = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_res.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch user info")
        info = userinfo_res.json()

    email = info.get("email")
    sub = info.get("sub")  # Google account id
    name = info.get("name")
    picture = info.get("picture")
    if not email:
        raise HTTPException(status_code=400, detail="Google userinfo missing email")

    # Upsert user
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    if not user:
        user = User(email=email, google_account_id=sub, display_name=name, avatar_url=picture)
        db.add(user)
    else:
        if not user.google_account_id:
            user.google_account_id = sub
        if not user.display_name and name:
            user.display_name = name
        if not user.avatar_url and picture:
            user.avatar_url = picture
        db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.email, extra={"uid": str(user.id)})
    
    # Redirect back to frontend with token
    from fastapi.responses import RedirectResponse
    from urllib.parse import urlencode
    
    frontend_url = "http://localhost:8080/auth/callback"
    params = {
        "access_token": token,
        "token_type": "bearer", 
        "is_new": str(user.display_name is None).lower()
    }
    redirect_url = f"{frontend_url}?{urlencode(params)}"
    
    return RedirectResponse(url=redirect_url)


@router.get("/me")
async def me(subject: str = Depends(get_current_subject), db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == subject))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url,
        "provider": user.provider,
    }


@router.post("/profile")
async def update_profile(
    display_name: str | None = None,
    subject: str = Depends(get_current_subject),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(User).where(User.email == subject))
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if display_name is not None:
        user.display_name = display_name
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"ok": True}
