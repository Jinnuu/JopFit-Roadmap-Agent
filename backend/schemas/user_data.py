from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel

# Experience
class ExperienceBase(BaseModel):
    title: str
    category: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: str
    skills_gained: List[str] = []

class ExperienceCreate(ExperienceBase):
    pass

class ExperienceUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    skills_gained: Optional[List[str]] = None

class ExperienceOut(ExperienceBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Project
class ProjectBase(BaseModel):
    title: str
    role: str
    tech_stack: List[str] = []
    description: str
    contribution: str
    outcomes: Optional[str] = None
    project_url: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    role: Optional[str] = None
    tech_stack: Optional[List[str]] = None
    description: Optional[str] = None
    contribution: Optional[str] = None
    outcomes: Optional[str] = None
    project_url: Optional[str] = None

class ProjectOut(ProjectBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ResumeDraft
class ResumeDraftBase(BaseModel):
    title: str
    question: str
    answer: str
    target_company: Optional[str] = None

class ResumeDraftCreate(ResumeDraftBase):
    pass

class ResumeDraftUpdate(BaseModel):
    title: Optional[str] = None
    question: Optional[str] = None
    answer: Optional[str] = None
    target_company: Optional[str] = None

class ResumeDraftOut(ResumeDraftBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Preferences
class PreferredCompanyCreate(BaseModel):
    company_name: str
    industry: Optional[str] = None
    memo: Optional[str] = None

class PreferredCompanyOut(BaseModel):
    id: str
    user_id: str
    company_name: str
    industry: Optional[str] = None
    memo: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PreferredRoleCreate(BaseModel):
    role_name: str
    priority: int = 1

class PreferredRoleOut(BaseModel):
    id: str
    user_id: str
    role_name: str
    priority: int
    created_at: datetime

    class Config:
        from_attributes = True


class SavedJobPostingCreate(BaseModel):
    company_name: str
    position_title: str
    job_url: Optional[str] = None
    raw_text: str
    deadline: Optional[date] = None

class SavedJobPostingOut(BaseModel):
    id: str
    user_id: str
    company_name: str
    position_title: str
    job_url: Optional[str] = None
    raw_text: str
    deadline: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True
