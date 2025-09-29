from pydantic import BaseModel
from datetime import datetime

class MessageOut(BaseModel):
    id: str
    conversation_id: str
    sender_user_id: str | None = None
    external_from_email: str | None = None
    body_text: str | None = None
    body_html: str | None = None
    direction: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: str
    subject: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class CreateConversationIn(BaseModel):
    participants: list[str]
    subject: str | None = None

class CreateMessageIn(BaseModel):
    text: str | None = None
    attachments: list[str] | None = None  # URLs after upload
