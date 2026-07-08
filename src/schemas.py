from pydantic import BaseModel, Field
from typing import List, Optional

class UserInput(BaseModel):
    position: str = Field(..., description="지원 직무")
    job_posting: str = Field(..., description="채용공고")
    company_values: str = Field(..., description="기업 인재상")
    resume_draft: str = Field(..., description="자기소개서 초안")
    project_description: str = Field(..., description="개인 프로젝트 설명")
    tech_stack: str = Field(..., description="보유 기술스택")
    desired_duration: int = Field(..., description="희망 기간 (4, 6, 8주)")
    weekly_hours: int = Field(..., description="주당 투입 가능 시간")
    goal: str = Field(..., description="목표 (포트폴리오 제작, 서류 보완, 면접 대비)")

class JobRequirement(BaseModel):
    requirement: str = Field(..., description="핵심 요구사항 내용")
    importance: str = Field(..., description="중요도 (상/중/하)")
    evidence: str = Field("", description="채용공고 원문 내 근거 문구")

class JobAnalysis(BaseModel):
    job_summary: str = Field(..., description="채용공고 핵심 요약")
    extracted_requirements: List[JobRequirement] = Field(..., description="추출된 핵심 요구사항 리스트")

class UserProject(BaseModel):
    title: str = Field(..., description="프로젝트 제목")
    description: str = Field(..., description="프로젝트 설명")
    tech_stack: List[str] = Field(..., description="프로젝트 사용 기술")

class ProfileAnalysis(BaseModel):
    user_summary: str = Field(..., description="사용자 경험 요약")
    matched_experiences: List[str] = Field(..., description="매칭된 경험 리스트")

class FitGapItem(BaseModel):
    requirement: str = Field(..., description="요구사항")
    user_experience: str = Field(..., description="사용자 보유 경험")
    status: str = Field(..., description="적합 상태 (Strong Fit / Partial Fit / Gap)")
    action_item: str = Field(..., description="보완 필요 사항")

class FitGapAnalysis(BaseModel):
    summary: str = Field(..., description="Fit-Gap 분석 요약")
    strong_fits: List[FitGapItem] = Field(..., description="보유 역량이 강하게 부합하는 항목")
    partial_fits: List[FitGapItem] = Field(..., description="보유 역량이 부분 부합하는 항목")
    gaps: List[FitGapItem] = Field(..., description="부족하거나 없는 역량 항목")
    top_priorities: List[str] = Field(..., description="우선순위가 높은 역량 강화 대상")

class WeeklyPlan(BaseModel):
    week: int = Field(..., description="주차")
    goal: str = Field(..., description="주차별 목표")
    detail: str = Field(..., description="주차별 수행 상세 내용 및 학습 사항")

class Roadmap(BaseModel):
    recommended_project_title: str = Field(..., description="추천 프로젝트 제목")
    project_summary: str = Field(..., description="추천 프로젝트 요약")
    duration_weeks: int = Field(..., description="프로젝트 진행 기간 (주)")
    difficulty: str = Field(..., description="프로젝트 난이도 (상/중/하)")
    reason_for_recommendation: str = Field(..., description="해당 프로젝트 추천 이유")
    weekly_plan: List[WeeklyPlan] = Field(..., description="주차별 상세 계획")
    portfolio_outputs: List[str] = Field(..., description="최종 포트폴리오 산출물")
    resume_reflection_points: List[str] = Field(..., description="자기소개서 반영 포인트")
    interview_questions: List[str] = Field(..., description="면접 대비 예상 질문")

class RiskItem(BaseModel):
    category: str = Field(..., description="위험 분야 (개인정보, 미실행 계획, 허위 과장, 리소스 부족 등)")
    description: str = Field(..., description="위험 내용 상세")
    severity: str = Field(..., description="위험도 (상/중/하)")
    remedy: str = Field(..., description="개선 방안")

class RiskCheckResult(BaseModel):
    overall_risk_level: str = Field(..., description="전체 위험도 레벨 (안전/주의/위험)")
    risks: List[RiskItem] = Field(..., description="발견된 위험 리스트")
    safe_usage_note: str = Field(..., description="안전한 자기소개서 및 로드맵 작성 가이드")

class JopFitResult(BaseModel):
    job_summary: str = Field(..., description="채용공고 핵심 요약")
    user_summary: str = Field(..., description="사용자 경험 및 프로젝트 요약")
    extracted_requirements: List[JobRequirement] = Field(..., description="채용공고 추출 요구사항 리스트")
    matched_experiences: List[str] = Field(..., description="사용자 보유 경험 리스트")
    fit_gap_analysis: FitGapAnalysis = Field(..., description="Fit-Gap 분석 결과")
    roadmap: Roadmap = Field(..., description="추천 프로젝트 로드맵")
    risk_checks: RiskCheckResult = Field(..., description="위험 요소 점검 결과")
    evidence_coverage_rate: float = Field(..., description="근거 증빙 충족 비율 (비어 있지 않은 evidence 개수 / 전체 requirement 개수)")
    final_note: str = Field(..., description="최종 제언 및 격려의 말")
    referenced_rag_documents: List[dict] = Field(default_factory=list, description="참고한 RAG 문서 정보 리스트 (title, path, snippet, score)")
