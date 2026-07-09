from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class RAGSourceCreate(BaseModel):
    source_type: str
    title: str
    url: Optional[str] = None
    raw_text: str
    company_name: Optional[str] = None

class RAGSourceOut(BaseModel):
    id: str
    user_id: str
    source_type: str
    title: str
    url: Optional[str] = None
    raw_text: str
    company_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
