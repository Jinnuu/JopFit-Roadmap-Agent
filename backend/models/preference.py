import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Date, Integer
from sqlalchemy.orm import relationship
from backend.db.base import Base

class PreferredCompany(Base):
    __tablename__ = "preferred_companies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(100), nullable=False)
    industry = Column(String(100), nullable=True)
    memo = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="preferred_companies")


class PreferredRole(Base):
    __tablename__ = "preferred_roles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role_name = Column(String(100), nullable=False)
    priority = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="preferred_roles")


class SavedJobPosting(Base):
    __tablename__ = "saved_job_postings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(100), nullable=False)
    position_title = Column(String(200), nullable=False)
    job_url = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    deadline = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="saved_job_postings")
