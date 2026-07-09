import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.db.base import Base

class AnalysisHistory(Base):
    __tablename__ = "analysis_histories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    position = Column(String(100), nullable=False)
    company_name = Column(String(100), nullable=True)
    input_snapshot = Column(JSON, nullable=False) # JSON snapshot of user info during analysis
    result_json = Column(JSON, nullable=False) # Analysis result JSON (JopFitResult structure)
    mode = Column(String(20), nullable=False) # e.g. mock, llm
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="analyses")
    roadmaps = relationship("Roadmap", back_populates="analysis", cascade="all, delete-orphan")
