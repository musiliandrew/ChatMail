from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.users import router as users_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.messages import router as messages_router
from app.api.routes.auth import router as auth_router
from app.api.routes.presence import router as presence_router
from app.db.session import init_db
from app.services.minio_client import ensure_bucket
from app.ws import router as ws_router

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.API_CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/health", tags=["health"]) 
app.include_router(users_router, prefix="/users", tags=["users"]) 
app.include_router(conversations_router, prefix="/conversations", tags=["conversations"]) 
app.include_router(messages_router, prefix="/messages", tags=["messages"]) 
app.include_router(auth_router, prefix="/auth", tags=["auth"]) 
app.include_router(presence_router, tags=["presence"]) 
app.include_router(ws_router)


@app.on_event("startup")
async def on_startup():
    await init_db()
    await ensure_bucket()
