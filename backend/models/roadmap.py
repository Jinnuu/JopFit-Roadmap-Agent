import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.db.base import Base

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    analysis_id = Column(String(36), ForeignKey("analysis_histories.id", ondelete="SET NULL"), nullable=True)
    target_company = Column(String(100), nullable=True)
    target_role = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    duration_weeks = Column(Integer, default=4, nullable=False)
    start_date = Column(Date, nullable=False)
    status = Column(String(20), default="active", nullable=False) # active, completed, abandoned
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="roadmaps")
    analysis = relationship("AnalysisHistory", back_populates="roadmaps")
    tasks = relationship("RoadmapTask", back_populates="roadmap", cascade="all, delete-orphan")


class RoadmapTask(Base):
    __tablename__ = "roadmap_tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    roadmap_id = Column(String(36), ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False)
    week = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    detail = Column(Text, nullable=False)
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="todo", nullable=False) # todo, doing, done, skipped
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    roadmap = relationship("Roadmap", back_populates="tasks")
