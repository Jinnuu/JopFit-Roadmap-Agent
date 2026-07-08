import os
import json
import streamlit as st
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from src.schemas import UserInput
from src.graph import run_mock_workflow, run_llm_workflow

# Page settings
st.set_page_config(
    page_title="JopFit Roadmap Agent MVP",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Header Section
st.title("🎯 JopFit Roadmap Agent")
st.markdown("""
채용공고와 개인의 프로젝트/자소서를 분석하여 **Fit-Gap 분석**을 수행하고, 부족한 역량을 체계적으로 보완할 수 있는 맞춤형 **프로젝트 로드맵**을 제안합니다.
""")

# Sidebar settings
st.sidebar.header("⚙️ 설정 (Configuration)")
use_mock_env = os.getenv("USE_MOCK", "true").lower() == "true"
use_mock = st.sidebar.checkbox("Mock 모드 사용 (USE_MOCK)", value=use_mock_env)

# Display current run mode prominently
mode_label = "🔴 MOCK (API 미호출)" if use_mock else "🟢 REAL LLM (OpenAI API 호출)"
st.sidebar.markdown(f"**현재 실행 모드**: {mode_label}")

st.sidebar.markdown("---")
st.sidebar.markdown("### 🔑 API 설정 (Phase 2용)")
api_key = st.sidebar.text_input("OpenAI API Key", value=os.getenv("OPENAI_API_KEY", ""), type="password")
model_name = st.sidebar.selectbox("Model Name", ["gpt-4o-mini", "gpt-4o"], index=0)

if use_mock:
    st.sidebar.info("💡 현재 **Mock 모드**로 동작 중입니다. OpenAI API 호출 없이 로컬 샘플 데이터로 실행됩니다.")
else:
    st.sidebar.warning("⚠️ **실제 LLM 호출 모드**입니다. OpenAI API Key가 유효해야 실행 가능합니다.")

# Default Demo inputs
default_position = "AI 서비스 백엔드 인턴"
default_posting = """- Python 기반 API 개발 경험
- LLM API 활용 경험 우대
- RAG 또는 Vector DB 경험 우대
- Docker 기반 배포 경험 우대
- 사용자 로그 기반 서비스 개선 경험 우대"""
default_company_values = """문제를 구조화하고 빠르게 실험하는 사람
협업과 문서화를 중시하는 사람"""
default_resume_draft = """안녕하세요. Python 백엔드 개발자 지망생입니다. Django 기반 웹서비스 개발 프로젝트를 주로 진행해 왔습니다."""
default_project_desc = """Django와 MySQL 기반 식단·재고·발주 관리 웹서비스를 개발했습니다.
식수 예측 모델을 연동했고 Docker를 활용해 배포했습니다."""
default_tech_stack = "Python, Django, MySQL, Docker"

# Main Layout Columns
col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("📝 정보 입력 (Inputs)")
    
    position = st.text_input("💼 지원 직무", value=default_position)
    job_posting = st.text_area("📄 채용공고", value=default_posting, height=120)
    company_values = st.text_area("🌟 기업 인재상", value=default_company_values, height=80)
    
    resume_draft = st.text_area("✍️ 자기소개서 초안", value=default_resume_draft, height=120)
    project_description = st.text_area("🏗️ 개인 프로젝트 설명", value=default_project_desc, height=120)
    tech_stack = st.text_input("🛠️ 보유 기술스택", value=default_tech_stack)
    
    sub_col1, sub_col2, sub_col3 = st.columns(3)
    with sub_col1:
        desired_duration = st.selectbox("📅 희망 준비 기간", [4, 6, 8], index=1)  # 6 weeks default
    with sub_col2:
        weekly_hours = st.number_input("⏰ 주당 투입 가능 시간 (시간)", min_value=1, max_value=168, value=15)
    with sub_col3:
        goal = st.selectbox("🎯 목표", ["포트폴리오 제작", "서류 보완", "면접 대비"], index=0)
        
    analyze_button = st.button("🚀 매칭 & 로드맵 생성 시작", type="primary")

with col2:
    st.subheader("📊 분석 및 로드맵 결과 (Outputs)")
    
    if analyze_button:
        # Field validation warning
        if not position or not job_posting or not tech_stack:
            st.warning("⚠️ 지원 직무, 채용공고, 보유 기술스택은 필수 입력 항목입니다. 다시 확인해 주세요.")
        else:
            with st.spinner("JopFit Roadmap Agent가 분석 중입니다..."):
                user_input = UserInput(
                    position=position,
                    job_posting=job_posting,
                    company_values=company_values,
                    resume_draft=resume_draft,
                    project_description=project_description,
                    tech_stack=tech_stack,
                    desired_duration=desired_duration,
                    weekly_hours=weekly_hours,
                    goal=goal
                )
                
                # Propagate local API key to environment variables so get_llm can access it
                if api_key.strip():
                    os.environ["OPENAI_API_KEY"] = api_key.strip()
                elif os.getenv("OPENAI_API_KEY", "").strip():
                    pass # Keep existing environment variable
                else:
                    os.environ.pop("OPENAI_API_KEY", None)

                # Perform workflow execution with error shielding
                result = None
                try:
                    if use_mock:
                        result = run_mock_workflow(user_input)
                    else:
                        if not os.getenv("OPENAI_API_KEY"):
                            st.error("❌ API Key가 필요합니다. Mock 모드를 켜거나 .env에 OPENAI_API_KEY를 설정하세요.")
                            st.stop()
                        result = run_llm_workflow(user_input)
                except Exception as e:
                    st.error(f"❌ 분석 실행 중 에러가 발생했습니다:\n{str(e)}")
                    st.stop()
                
                # Show active execution mode at output top
                st.info(f"ℹ️ 이 결과는 **{'Mock 모드' if use_mock else '실제 OpenAI LLM 모드'}**로 생성되었습니다.")
                
                # 1. Summaries
                st.markdown("### 📌 직무 및 지원자 프로필 요약")
                st.markdown(f"**[공고 핵심 요약]**\n{result.job_summary}")
                st.markdown(f"**[지원자 경험 요약]**\n{result.user_summary}")
                
                # Extracted requirements list
                with st.expander("🔍 채용공고 핵심 추출 요구사항"):
                    for req in result.extracted_requirements:
                        importance_color = {"상": "red", "중": "orange", "하": "green"}.get(req.importance, "blue")
                        st.markdown(f"- **{req.requirement}** :중요도:<span style='color:{importance_color}'>**[{req.importance}]**</span>", unsafe_allow_html=True)
                        if req.evidence:
                            st.markdown(f"  *근거 문구: \"{req.evidence}\"*")
                
                # Matched experiences list
                with st.expander("🔗 지원자 보유 매칭 경험"):
                    for exp in result.matched_experiences:
                        st.markdown(f"- {exp}")
                        
                st.markdown("---")
                
                # 2. Fit-Gap Analysis Table
                st.markdown("### 📊 Fit-Gap 분석")
                st.markdown(f"*{result.fit_gap_analysis.summary}*")
                
                fit_gap_data = []
                
                # Helper function to classify fit status
                def get_status_badge(status):
                    if status == "Strong Fit":
                        return "🟢 Strong Fit"
                    elif status == "Partial Fit":
                        return "🟡 Partial Fit"
                    else:
                        return "🔴 Gap"
                
                for item in result.fit_gap_analysis.strong_fits + result.fit_gap_analysis.partial_fits + result.fit_gap_analysis.gaps:
                    fit_gap_data.append({
                        "요구사항": item.requirement,
                        "보유 경험": item.user_experience,
                        "적합도": get_status_badge(item.status),
                        "보완 계획": item.action_item
                    })
                
                st.table(fit_gap_data)
                
                # Evidence coverage rate
                rate_pct = int(result.evidence_coverage_rate * 100)
                st.metric("📈 근거 증빙 충족 비율 (Evidence Coverage Rate)", f"{rate_pct}%", help="채용공고 요구사항 대비 자소서/프로젝트 설명에서 명시적인 근거가 매칭된 비율입니다.")
                
                st.markdown("---")
                
                # 3. Recommended Project & Roadmap
                st.markdown("### 📅 추천 프로젝트 및 로드맵")
                st.info(f"💡 **추천 프로젝트**: **{result.roadmap.recommended_project_title}**\n\n*{result.roadmap.project_summary}*")
                st.markdown(f"**추천 사유**: {result.roadmap.reason_for_recommendation}")
                st.markdown(f"**진행 기간**: {result.roadmap.duration_weeks}주 | **난이도**: {result.roadmap.difficulty}")
                
                st.markdown("#### 🗓️ 주차별 마일스톤 계획")
                for plan in result.roadmap.weekly_plan:
                    st.markdown(f"**{plan.week}주차: {plan.goal}**")
                    st.write(plan.detail)
                    
                st.markdown("---")
                
                # 4. Outputs & Reflection
                st.markdown("### 📁 아웃풋 & 자기소개서 반영")
                
                out_col1, out_col2 = st.columns(2)
                with out_col1:
                    st.markdown("**📂 최종 포트폴리오 산출물**")
                    for out in result.roadmap.portfolio_outputs:
                        st.markdown(f"- {out}")
                with out_col2:
                    st.markdown("**✏️ 자기소개서 반영 포인트**")
                    for pt in result.roadmap.resume_reflection_points:
                        st.markdown(f"- {pt}")
                        
                st.markdown("---")
                
                # 5. Interview Questions
                with st.expander("💬 예상 면접 질문"):
                    for q in result.roadmap.interview_questions:
                        st.markdown(f"- **{q}**")
                        
                # 6. Risk Checks
                st.markdown("### ⚠️ 리스크 검증 결과")
                risk_level_color = {"안전": "green", "주의": "orange", "위험": "red"}.get(result.risk_checks.overall_risk_level, "blue")
                st.markdown(f"종합 위험도 수준: <span style='color:{risk_level_color}';font-weight:bold;>**[{result.risk_checks.overall_risk_level}]**</span>", unsafe_allow_html=True)
                
                for risk in result.risk_checks.risks:
                    sev_color = {"상": "red", "중": "orange", "하": "green"}.get(risk.severity, "blue")
                    st.markdown(f"- **[{risk.category}]** (위험도: <span style='color:{sev_color}'>**{risk.severity}**</span>)", unsafe_allow_html=True)
                    st.markdown(f"  * {risk.description}")
                    st.markdown(f"  * **조치 방안**: {risk.remedy}")
                    
                st.warning(result.risk_checks.safe_usage_note)
                
                st.markdown("---")
                
                # 7. Referenced RAG Documents
                with st.expander("📚 참고한 RAG 문서"):
                    for doc in result.referenced_rag_documents:
                        st.markdown(f"**[{doc['title']}]** (유사도 점수: {doc['score']})")
                        st.markdown(f"경로: `{doc['path']}`")
                        st.markdown(f"내용 요약: *{doc['snippet']}*")
                        st.markdown("---")
                
                # Final Note
                st.success(result.final_note)
                
                # 8. JSON Download button
                # Serialize result to JSON string
                result_json = result.model_dump_json(indent=2)
                st.download_button(
                    label="💾 분석 결과 JSON 다운로드",
                    data=result_json,
                    file_name="jopfit_roadmap_result.json",
                    mime="application/json"
                )
    else:
        st.info("👈 왼쪽 입력창에 채용 정보 및 이력을 넣고 **매칭 & 로드맵 생성 시작** 버튼을 눌러주세요.")
