from pydantic import BaseModel, Field
from typing import Optional

class AnalyzeRequest(BaseModel):
    position: str = Field(..., description="지원 직무")
    job_posting: str = Field(..., description="채용공고")
    company_values: str = Field(..., description="기업 인재상")
    resume_draft: str = Field(..., description="자기소개서 초안")
    project_description: str = Field(..., description="개인 프로젝트 설명")
    tech_stack: str = Field(..., description="보유 기술스택")
    desired_duration: int = Field(..., description="희망 기간 (4, 6, 8주)")
    weekly_hours: int = Field(..., description="주당 투입 가능 시간")
    goal: str = Field(..., description="목표 (포트폴리오 제작, 서류 보완, 면접 대비)")
    use_mock: bool = Field(True, description="Mock 모드 사용 여부")
    api_key: Optional[str] = Field(None, description="OpenAI API 키")

class AnalyzeErrorResponse(BaseModel):
    error: str = Field(..., description="에러 내용")
    details: str = Field(..., description="에러 상세 원인")
