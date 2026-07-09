import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.user import User
from backend.models.experience import Experience
from backend.models.project import Project
from backend.models.resume import ResumeDraft
from backend.models.analysis import AnalysisHistory
from backend.schemas.analysis import AnalysisRequest, AnalysisOut, AnalysisResponse
from backend.deps import get_current_user

# Import existing schemas and graph workflow
from src.schemas import UserInput
from src.graph import run_mock_workflow, run_llm_workflow

router = APIRouter(prefix="/api/analyses", tags=["analyses"])

@router.post("", response_model=AnalysisResponse)
def create_analysis(
    req: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch user career items
    exps = db.query(Experience).filter(Experience.user_id == current_user.id).all()
    projs = db.query(Project).filter(Project.user_id == current_user.id).all()
    resumes = db.query(ResumeDraft).filter(ResumeDraft.user_id == current_user.id).all()

    # 2. Synthesize input snapshot
    # Aggregate tech stack
    tech_stack_set = set()
    for proj in projs:
        if proj.tech_stack:
            tech_stack_set.update(proj.tech_stack)
    for exp in exps:
        if exp.skills_gained:
            tech_stack_set.update(exp.skills_gained)
    tech_stack_list = list(tech_stack_set)

    # Synthesize project description
    project_parts = []
    for proj in projs:
        part = f"제목: {proj.title}\n역할: {proj.role}\n기술스택: {', '.join(proj.tech_stack)}\n설명: {proj.description}\n기여도: {proj.contribution}"
        if proj.outcomes:
            part += f"\n성과: {proj.outcomes}"
        project_parts.append(part)
    synthesized_projects = "\n\n".join(project_parts) if project_parts else "등록된 프로젝트가 없습니다."

    # Synthesize resume draft
    resume_parts = []
    for res in resumes:
        resume_parts.append(f"질문: {res.question}\n답변: {res.answer}")
    for exp in exps:
        resume_parts.append(f"경험명: {exp.title} ({exp.category})\n설명: {exp.description}")
    synthesized_resumes = "\n\n".join(resume_parts) if resume_parts else "등록된 자기소개서 초안 및 경험 이력이 없습니다."

    # 3. Create input snapshot dictionary to save in database
    input_snapshot = {
        "position": req.position,
        "job_posting": req.job_description,
        "company_values": req.company_values,
        "resume_draft": synthesized_resumes,
        "project_description": synthesized_projects,
        "tech_stack": tech_stack_list,
        "desired_duration": req.desired_duration,
        "weekly_hours": req.weekly_hours,
        "goal": req.goal
    }

    # 4. Construct UserInput schema for existing workflow
    user_input = UserInput(
        position=req.position,
        job_posting=req.job_description,
        company_values=req.company_values,
        resume_draft=synthesized_resumes,
        project_description=synthesized_projects,
        tech_stack=tech_stack_list,
        desired_duration=req.desired_duration,
        weekly_hours=req.weekly_hours,
        goal=req.goal
    )

    # 5. Handle API Key temporal assignment and run workflow
    original_env_key = os.environ.get("OPENAI_API_KEY")
    if req.api_key and req.api_key.strip():
        os.environ["OPENAI_API_KEY"] = req.api_key.strip()

    try:
        if req.mode == "mock":
            result_workflow = run_mock_workflow(user_input)
        else:
            current_key = os.environ.get("OPENAI_API_KEY", "").strip()
            if not current_key:
                raise HTTPException(
                    status_code=400,
                    detail="OpenAI API Key가 설정되지 않았습니다. Mock 모드를 사용하거나 유효한 OpenAI API Key를 제공하십시오."
                )
            result_workflow = run_llm_workflow(user_input)
        
        # result_workflow is an instance of JopFitResult. We convert it to a dict for JSONB storage.
        # But to ensure it matches exactly the output structure, we call model_dump() / dict()
        if hasattr(result_workflow, "model_dump"):
            result_dict = result_workflow.model_dump()
        else:
            result_dict = result_workflow.dict()

        # 6. Save in database
        title = f"{req.company_name or '미정'} - {req.position} 분석"
        history = AnalysisHistory(
            user_id=current_user.id,
            title=title,
            position=req.position,
            company_name=req.company_name,
            input_snapshot=input_snapshot,
            result_json=result_dict,
            mode=req.mode
        )
        db.add(history)
        db.commit()
        db.refresh(history)

        return {
            "analysis_id": history.id,
            "status": "completed",
            "result": result_dict
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"분석 작업 수행 중 서버 내부 오류가 발생하였습니다: {str(e)}"
        )
    finally:
        # Restore environment API key
        if original_env_key:
            os.environ["OPENAI_API_KEY"] = original_env_key
        else:
            os.environ.pop("OPENAI_API_KEY", None)

@router.get("", response_model=List[AnalysisOut])
def list_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AnalysisHistory).filter(AnalysisHistory.user_id == current_user.id).order_by(AnalysisHistory.created_at.desc()).all()

@router.get("/{analysis_id}", response_model=AnalysisOut)
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == current_user.id
    ).first()
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis history not found or access denied"
        )
    return history

@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == current_user.id
    ).first()
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis history not found or access denied"
        )
    db.delete(history)
    db.commit()
    return
