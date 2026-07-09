import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.db.base import Base

class RAGSource(Base):
    __tablename__ = "rag_sources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source_type = Column(String(50), nullable=False) # e.g. job_posting, company_value, etc.
    title = Column(String(200), nullable=False)
    url = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    company_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="rag_sources")
