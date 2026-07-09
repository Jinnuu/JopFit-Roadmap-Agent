import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.db.base import Base

class Experience(Base):
    __tablename__ = "experiences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False) # e.g. activity, education, internship
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    description = Column(Text, nullable=False)
    skills_gained = Column(JSON, default=list, nullable=True) # JSON list
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="experiences")
