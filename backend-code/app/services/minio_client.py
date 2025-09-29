from minio import Minio
from app.core.config import settings

_client: Minio | None = None


def get_minio() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=bool(settings.MINIO_SECURE),
        )
    return _client


async def ensure_bucket():
    client = get_minio()
    found = client.bucket_exists(settings.MINIO_BUCKET)
    if not found:
        client.make_bucket(settings.MINIO_BUCKET)
