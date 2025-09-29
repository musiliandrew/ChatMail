# MailChat Backend (FastAPI + Postgres + Redis + MinIO)

## Run (Docker Compose)

```bash
docker compose up --build
```

Backend: http://localhost:8000/docs
Postgres: localhost:5432
Redis: localhost:6379
MinIO: http://localhost:9000 (Console: http://localhost:9001)

## Environment

Copy `.env.example` to `.env` and adjust as needed.

## Endpoints (MVP)
- `GET /health/live` / `GET /health/ready`
- `GET /users/exists?email=...`
- `POST /users/invites?email=...` (placeholder; returns token)
- `GET /conversations` (list)
- `POST /conversations` { participants: string[], subject? }
- `GET /messages/{conversation_id}`
- `POST /messages/{conversation_id}` { text, attachments? }

## Notes
- Tables auto-created on startup for dev. Use Alembic for migrations later.
- Gmail integration, auth, and WebSocket are placeholders to be added.
- MinIO will be used for media uploads via pre-signed URLs (to implement).
