import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load workspace .env variables
load_dotenv()

from src.schemas import UserInput, JopFitResult
from src.graph import run_mock_workflow, run_llm_workflow
from backend.api_models import AnalyzeRequest

# Import V2 API routers
from backend.api.auth import router as auth_router
from backend.api.experiences import router as experiences_router
from backend.api.projects import router as projects_router
from backend.api.resume_drafts import router as resume_drafts_router
from backend.api.preferences import router as preferences_router
from backend.api.analyses import router as analyses_router
from backend.api.roadmaps import router as roadmaps_router
from backend.api.notifications import router as notifications_router
from backend.api.recommendations import router as recommendations_router
from backend.api.rag_sources import router as rag_sources_router

app = FastAPI(
    title="JobFit Roadmap Agent API",
    description="FastAPI Backend for JobFit Roadmap Agent MVP",
    version="2.0.0"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow requests from frontend dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register new authentication-based routers
app.include_router(auth_router)
app.include_router(experiences_router)
app.include_router(projects_router)
app.include_router(resume_drafts_router)
app.include_router(preferences_router)
app.include_router(analyses_router)
app.include_router(roadmaps_router)
app.include_router(notifications_router)
app.include_router(recommendations_router)
app.include_router(rag_sources_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "jobfit-roadmap-agent"
    }

@app.post("/api/analyze", response_model=JopFitResult)
def analyze_endpoint(req: AnalyzeRequest):
    # Convert API model to Pydantic user input schema
    user_input = UserInput(
        position=req.position,
        job_posting=req.job_posting,
        company_values=req.company_values,
        resume_draft=req.resume_draft,
        project_description=req.project_description,
        tech_stack=req.tech_stack,
        desired_duration=req.desired_duration,
        weekly_hours=req.weekly_hours,
        goal=req.goal
    )
    
    # Store the original API key to restore it later
    original_env_key = os.environ.get("OPENAI_API_KEY")
    
    # Temporarily set the request API key if provided
    if req.api_key and req.api_key.strip():
        os.environ["OPENAI_API_KEY"] = req.api_key.strip()
    
    try:
        if req.use_mock:
            result = run_mock_workflow(user_input)
        else:
            current_key = os.environ.get("OPENAI_API_KEY", "").strip()
            if not current_key:
                raise HTTPException(
                    status_code=400,
                    detail="OpenAI API Key가 설정되지 않았습니다. Mock 모드를 사용하거나 유효한 OpenAI API Key를 제공하십시오."
                )
            result = run_llm_workflow(user_input)
            
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        # Wrap system exception details cleanly
        raise HTTPException(
            status_code=500,
            detail=f"분석 작업 수행 중 서버 내부 오류가 발생하였습니다: {str(e)}"
        )
    finally:
        # Restore environment variables to prevent leakage
        if original_env_key:
            os.environ["OPENAI_API_KEY"] = original_env_key
        else:
            os.environ.pop("OPENAI_API_KEY", None)
