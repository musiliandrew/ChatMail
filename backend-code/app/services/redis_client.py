import asyncio
import json
from typing import Any
from redis.asyncio import Redis
from app.core.config import settings

redis: Redis | None = None


def get_redis() -> Redis:
    global redis
    if redis is None:
        redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return redis

async def publish(channel: str, message: dict[str, Any]):
    r = get_redis()
    await r.publish(channel, json.dumps(message))
