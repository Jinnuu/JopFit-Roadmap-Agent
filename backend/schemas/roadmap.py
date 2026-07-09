from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel

class RoadmapTaskBase(BaseModel):
    week: int
    title: str
    detail: str
    due_date: Optional[date] = None
    status: str = "todo" # todo, doing, done, skipped

class RoadmapTaskUpdate(BaseModel):
    status: str

class RoadmapTaskOut(RoadmapTaskBase):
    id: str
    roadmap_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoadmapCreateRequest(BaseModel):
    start_date: date


class RoadmapOut(BaseModel):
    id: str
    user_id: str
    analysis_id: Optional[str] = None
    target_company: Optional[str] = None
    target_role: str
    title: str
    duration_weeks: int
    start_date: date
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RoadmapDetailOut(RoadmapOut):
    tasks: List[RoadmapTaskOut] = []

    class Config:
        from_attributes = True
