from typing import Any, Dict, Optional
from datetime import datetime
from pydantic import BaseModel

class AnalysisRequest(BaseModel):
    company_name: Optional[str] = None
    position: str
    job_description: str
    company_values: Optional[str] = ""
    mode: str = "mock" # mock or llm
    desired_duration: int = 4
    weekly_hours: int = 10
    goal: Optional[str] = ""
    api_key: Optional[str] = None


class AnalysisOut(BaseModel):
    id: str
    user_id: str
    title: str
    position: str
    company_name: Optional[str] = None
    input_snapshot: Dict[str, Any]
    result_json: Dict[str, Any]
    mode: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    result: Dict[str, Any]
