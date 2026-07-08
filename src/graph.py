import os
import json
from typing import TypedDict, Optional, List, Dict, Any
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END

from src.schemas import (
    UserInput, JopFitResult, JobRequirement, FitGapItem, FitGapAnalysis,
    WeeklyPlan, Roadmap, RiskItem, RiskCheckResult, JobAnalysis, ProfileAnalysis
)
from src.sample_data import get_mock_result
from src.rag import search_documents
from src.risk_checker import scan_for_risks
from src.llm import call_llm_json
from src.prompts import (
    JOB_ANALYSIS_PROMPT, PROFILE_ANALYSIS_PROMPT, FIT_GAP_PROMPT, ROADMAP_PROMPT
)

load_dotenv()

# --- TypedDict for LangGraph State ---

class JopFitState(TypedDict, total=False):
    user_input: UserInput
    use_llm: bool
    validation_errors: list[str]
    job_summary: str
    user_summary: str
    extracted_requirements: list
    matched_experiences: list
    skill_docs: list[dict]
    fit_gap_analysis: Any
    project_docs: list[dict]
    roadmap: Any
    risk_checks: Any
    final_result: JopFitResult
    errors: list[str]


# --- Common Helper Nodes ---

def validate_input(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 1: Validates user inputs to check for missing required fields.
    """
    user_input = state["user_input"]
    errors = []
    
    if not user_input.position.strip():
        errors.append("지원 직무가 입력되지 않았습니다.")
    if not user_input.job_posting.strip():
        errors.append("채용공고가 입력되지 않았습니다.")
    if not user_input.tech_stack.strip():
        errors.append("보유 기술스택이 입력되지 않았습니다.")
        
    state["validation_errors"] = errors
    state["status"] = "validated"
    return state

def retrieve_skill_docs(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 4: Retrieves reference skill documents using position + tech stack.
    """
    user_input = state["user_input"]
    # RAG search query 1: Position + Job Posting snippets + Tech Stack
    query = f"{user_input.position} {user_input.job_posting[:60]} {user_input.tech_stack}"
    rag_docs = search_documents(query)
    
    state["skill_docs"] = rag_docs
    return state

def retrieve_project_templates(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 6: Retrieves recommended project templates from dictionary.
    """
    user_input = state["user_input"]
    # RAG search query 2: Gap Priorities + Desired Duration + Project
    fit_gap = state["fit_gap_analysis"]
    
    # Extract top priorities string
    if hasattr(fit_gap, "top_priorities") and fit_gap.top_priorities:
        priorities = " ".join(fit_gap.top_priorities)
    else:
        priorities = ""
        
    query = f"{priorities} {user_input.desired_duration}주 프로젝트 템플릿"
    project_docs = search_documents(query)
    
    state["project_docs"] = project_docs
    return state

def check_risks(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 8: Audits inputs and generated plans for compliance issues (e.g. personal info, overstatements).
    """
    user_input = state["user_input"]
    roadmap = state["roadmap"]
    
    # Run the risk checker utility
    risk_result = scan_for_risks(user_input, roadmap.weekly_plan)
    
    state["risk_checks"] = risk_result
    return state

def format_final_result(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 9: Synthesizes final JopFitResult instance and calculates evidence coverage rate.
    """
    user_input = state["user_input"]
    mock_res = get_mock_result(user_input)
    
    # Calculate evidence coverage rate (non-empty evidence / total requirements)
    requirements = state["extracted_requirements"]
    non_empty = sum(1 for req in requirements if req.evidence.strip())
    total = len(requirements)
    evidence_rate = float(non_empty) / total if total > 0 else 0.0
    
    # Combine reference documents from both retrievals (deduplicating by path)
    all_docs = state.get("skill_docs", []) + state.get("project_docs", [])
    seen_paths = set()
    deduped_docs = []
    for doc in all_docs:
        if doc["path"] not in seen_paths:
            seen_paths.add(doc["path"])
            deduped_docs.append(doc)
            
    final_result = JopFitResult(
        job_summary=state["job_summary"],
        user_summary=state["user_summary"],
        extracted_requirements=state["extracted_requirements"],
        matched_experiences=state["matched_experiences"],
        fit_gap_analysis=state["fit_gap_analysis"],
        roadmap=state["roadmap"],
        risk_checks=state["risk_checks"],
        evidence_coverage_rate=round(evidence_rate, 2),
        final_note=mock_res.final_note,
        referenced_rag_documents=deduped_docs
    )
    
    state["final_result"] = final_result
    return state


# --- Phase 1: Mock Workflow Nodes ---

def analyze_job(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 2 (Mock): Summarizes job posting and extracts key requirements.
    """
    user_input = state["user_input"]
    mock_res = get_mock_result(user_input)
    state["job_summary"] = mock_res.job_summary
    state["extracted_requirements"] = mock_res.extracted_requirements
    return state

def analyze_profile(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 3 (Mock): Summarizes profile experiences.
    """
    user_input = state["user_input"]
    mock_res = get_mock_result(user_input)
    state["user_summary"] = mock_res.user_summary
    state["matched_experiences"] = mock_res.matched_experiences
    return state

def analyze_fit_gap(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 5 (Mock): Fits candidate experiences against job specs.
    """
    user_input = state["user_input"]
    mock_res = get_mock_result(user_input)
    state["fit_gap_analysis"] = mock_res.fit_gap_analysis
    return state

def generate_roadmap(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 7 (Mock): Outputs standard roadmap based on mock result.
    """
    user_input = state["user_input"]
    mock_res = get_mock_result(user_input)
    state["roadmap"] = mock_res.roadmap
    return state


# --- Phase 2: Actual LLM Workflow Nodes ---

def analyze_job_llm(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 2 (LLM): Calls OpenAI to parse and summarize job posting.
    """
    user_input = state["user_input"]
    prompt = JOB_ANALYSIS_PROMPT.format(
        position=user_input.position,
        job_posting=user_input.job_posting
    )
    llm_res = call_llm_json(prompt)
    if "error" in llm_res:
        raise ValueError(f"채용공고 LLM 분석 중 에러가 발생했습니다: {llm_res['error']}. 상세: {llm_res.get('details', '')}")
        
    try:
        job_data = JobAnalysis(**llm_res)
    except Exception as e:
        raise ValueError(f"채용공고 분석 Pydantic 검증 실패: {str(e)}\n\n[수신 원본]: {json.dumps(llm_res, ensure_ascii=False)}")
        
    state["job_summary"] = job_data.job_summary
    state["extracted_requirements"] = job_data.extracted_requirements
    return state

def analyze_profile_llm(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 3 (LLM): Calls OpenAI to summarize user profile and matched experiences.
    """
    user_input = state["user_input"]
    prompt = PROFILE_ANALYSIS_PROMPT.format(
        resume_draft=user_input.resume_draft,
        project_description=user_input.project_description,
        tech_stack=user_input.tech_stack
    )
    llm_res = call_llm_json(prompt)
    if "error" in llm_res:
        raise ValueError(f"사용자 프로필 LLM 분석 중 에러가 발생했습니다: {llm_res['error']}. 상세: {llm_res.get('details', '')}")
        
    try:
        profile_data = ProfileAnalysis(**llm_res)
    except Exception as e:
        raise ValueError(f"사용자 프로필 분석 Pydantic 검증 실패: {str(e)}\n\n[수신 원본]: {json.dumps(llm_res, ensure_ascii=False)}")
        
    state["user_summary"] = profile_data.user_summary
    state["matched_experiences"] = profile_data.matched_experiences
    return state

def analyze_fit_gap_llm(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 5 (LLM): Maps extracted job requirements against candidate profile matches.
    """
    reqs_list = []
    for req in state["extracted_requirements"]:
        reqs_list.append(req.model_dump() if hasattr(req, "model_dump") else req.dict())
        
    job_analysis_str = json.dumps({
        "job_summary": state["job_summary"],
        "extracted_requirements": reqs_list
    }, ensure_ascii=False)
    
    profile_analysis_str = json.dumps({
        "user_summary": state["user_summary"],
        "matched_experiences": state["matched_experiences"]
    }, ensure_ascii=False)
    
    prompt = FIT_GAP_PROMPT.format(
        job_analysis=job_analysis_str,
        profile_analysis=profile_analysis_str
    )
    llm_res = call_llm_json(prompt)
    if "error" in llm_res:
        raise ValueError(f"Fit-Gap LLM 분석 중 에러가 발생했습니다: {llm_res['error']}. 상세: {llm_res.get('details', '')}")
        
    try:
        fit_gap_data = FitGapAnalysis(**llm_res)
    except Exception as e:
        raise ValueError(f"Fit-Gap 분석 Pydantic 검증 실패: {str(e)}\n\n[수신 원본]: {json.dumps(llm_res, ensure_ascii=False)}")
        
    state["fit_gap_analysis"] = fit_gap_data
    return state

def generate_roadmap_llm(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Node 7 (LLM): Outputs custom weekly roadmap and portfolio deliverables.
    """
    user_input = state["user_input"]
    fit_gap = state["fit_gap_analysis"]
    
    fit_gap_str = fit_gap.model_dump_json() if hasattr(fit_gap, "model_dump_json") else fit_gap.json()
    
    rag_docs_list = state.get("skill_docs", []) + state.get("project_docs", [])
    rag_docs_str = json.dumps(rag_docs_list, ensure_ascii=False)
    
    prompt = ROADMAP_PROMPT.format(
        desired_duration=user_input.desired_duration,
        weekly_hours=user_input.weekly_hours,
        goal=user_input.goal,
        fit_gap_analysis=fit_gap_str,
        rag_docs=rag_docs_str
    )
    llm_res = call_llm_json(prompt)
    if "error" in llm_res:
        raise ValueError(f"로드맵 생성 LLM 호출 중 에러가 발생했습니다: {llm_res['error']}. 상세: {llm_res.get('details', '')}")
        
    try:
        roadmap_data = Roadmap(**llm_res)
    except Exception as e:
        raise ValueError(f"로드맵 생성 Pydantic 검증 실패: {str(e)}\n\n[수신 원본]: {json.dumps(llm_res, ensure_ascii=False)}")
        
    state["roadmap"] = roadmap_data
    return state


# --- LangGraph Wrapper Nodes ---

def node_validate_input(state: JopFitState) -> JopFitState:
    state = validate_input(state)
    if state.get("validation_errors"):
        raise ValueError(", ".join(state["validation_errors"]))
    return state

def node_analyze_job(state: JopFitState) -> JopFitState:
    if state.get("use_llm"):
        return analyze_job_llm(state)
    return analyze_job(state)

def node_analyze_profile(state: JopFitState) -> JopFitState:
    if state.get("use_llm"):
        return analyze_profile_llm(state)
    return analyze_profile(state)

def node_retrieve_skill_docs(state: JopFitState) -> JopFitState:
    return retrieve_skill_docs(state)

def node_analyze_fit_gap(state: JopFitState) -> JopFitState:
    if state.get("use_llm"):
        return analyze_fit_gap_llm(state)
    return analyze_fit_gap(state)

def node_retrieve_project_templates(state: JopFitState) -> JopFitState:
    return retrieve_project_templates(state)

def node_generate_roadmap(state: JopFitState) -> JopFitState:
    if state.get("use_llm"):
        return generate_roadmap_llm(state)
    return generate_roadmap(state)

def node_check_risks(state: JopFitState) -> JopFitState:
    return check_risks(state)

def node_format_final_result(state: JopFitState) -> JopFitState:
    return format_final_result(state)


# --- StateGraph Construction Builder ---

def build_jopfit_graph():
    graph = StateGraph(JopFitState)

    graph.add_node("validate_input", node_validate_input)
    graph.add_node("analyze_job", node_analyze_job)
    graph.add_node("analyze_profile", node_analyze_profile)
    graph.add_node("retrieve_skill_docs", node_retrieve_skill_docs)
    graph.add_node("analyze_fit_gap", node_analyze_fit_gap)
    graph.add_node("retrieve_project_templates", node_retrieve_project_templates)
    graph.add_node("generate_roadmap", node_generate_roadmap)
    graph.add_node("check_risks", node_check_risks)
    graph.add_node("format_final_result", node_format_final_result)

    graph.add_edge(START, "validate_input")
    graph.add_edge("validate_input", "analyze_job")
    graph.add_edge("analyze_job", "analyze_profile")
    graph.add_edge("analyze_profile", "retrieve_skill_docs")
    graph.add_edge("retrieve_skill_docs", "analyze_fit_gap")
    graph.add_edge("analyze_fit_gap", "retrieve_project_templates")
    graph.add_edge("retrieve_project_templates", "generate_roadmap")
    graph.add_edge("generate_roadmap", "check_risks")
    graph.add_edge("check_risks", "format_final_result")
    graph.add_edge("format_final_result", END)

    return graph.compile()


# --- Workflow Execution Runners ---

def run_graph_workflow(user_input: UserInput, use_llm: bool = False) -> JopFitResult:
    """
    Builds the graph, creates state with the use_llm parameter, and invokes it.
    """
    app = build_jopfit_graph()
    initial_state: JopFitState = {
        "user_input": user_input,
        "use_llm": use_llm,
        "errors": []
    }
    final_state = app.invoke(initial_state)
    return final_state["final_result"]

def run_mock_workflow(user_input: UserInput) -> JopFitResult:
    """
    Wrapper mapping mock execution path on LangGraph StateGraph.
    """
    return run_graph_workflow(user_input, use_llm=False)

def run_llm_workflow(user_input: UserInput) -> JopFitResult:
    """
    Wrapper mapping LLM execution path on LangGraph StateGraph.
    """
    return run_graph_workflow(user_input, use_llm=True)
