import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from backend.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    experiences = relationship("Experience", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("ResumeDraft", back_populates="user", cascade="all, delete-orphan")
    preferred_companies = relationship("PreferredCompany", back_populates="user", cascade="all, delete-orphan")
    preferred_roles = relationship("PreferredRole", back_populates="user", cascade="all, delete-orphan")
    saved_job_postings = relationship("SavedJobPosting", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("AnalysisHistory", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    rag_sources = relationship("RAGSource", back_populates="user", cascade="all, delete-orphan")
