from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    related_roadmap_id: Optional[str] = None
    related_task_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
