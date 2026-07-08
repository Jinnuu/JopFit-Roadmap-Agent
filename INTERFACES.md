# INTERFACES.md

# JopFit Roadmap Agent 인터페이스 정의서

이 문서는 JopFit Roadmap Agent MVP의 데이터 모델, LangGraph 상태(State), 워크플로우 진입 함수 및 노드별 데이터 규격을 기술한다.

> **이 문서를 기준으로 향후 코드를 수정한다.**

---

## 1. Core Data Models (Pydantic Schemas)

### 1.1 UserInput
사용자로부터 화면에서 수집되는 원본 입력 데이터 규격이다.
* **position** (`str`): 지원 직무 (예: "AI 서비스 백엔드 인턴")
* **job_posting** (`str`): 채용공고 원문 텍스트
* **company_values** (`str`): 기업 인재상 설명
* **resume_draft** (`str`): 자기소개서 초안
* **project_description** (`str`): 기존에 진행한 개인 프로젝트 설명
* **tech_stack** (`str`): 사용자가 보유한 기술스택 목록
* **desired_duration** (`int`): 희망 준비 기간 (4, 6, 8 중 선택)
* **weekly_hours** (`int`): 주당 투입 가능한 시간
* **goal** (`str`): 목표 유형 ("포트폴리오 제작", "서류 보완", "면접 대비" 중 선택)

### 1.2 JobRequirement
채용공고 본문에서 추출한 단일 핵심 요구사항이다.
* **requirement** (`str`): 핵심 요구사항 내용
* **importance** (`str`): 중요도 ("상", "중", "하" 중 선택)
* **evidence** (`str`): 채용공고 내 원문 근거 문구 (존재하지 않거나 명시되지 않은 경우 빈 문자열 `""`)

### 1.3 JobAnalysis
채용공고 분석 결과를 구조화한 모델이다.
* **job_summary** (`str`): 채용공고의 핵심 요약 내용
* **extracted_requirements** (`List[JobRequirement]`): 추출된 직무 요구사항 리스트

### 1.4 ProfileAnalysis
지원자의 보유 역량 및 경험을 요약한 모델이다.
* **user_summary** (`str`): 사용자 경험 및 역량 요약
* **matched_experiences** (`List[str]`): 채용공고 요구사항과 매칭되는 사용자 보유 경험 리스트

### 1.5 FitGapItem
요구사항별 지원자 적합도 분석 단위를 정의한다.
* **requirement** (`str`): 직무 요구사항 내용
* **user_experience** (`str`): 요구사항에 대응되는 지원자 보유 경험
* **status** (`str`): 매칭 적합도 ("Strong Fit", "Partial Fit", "Gap" 중 하나)
* **action_item** (`str`): 부족한 부분을 보완하기 위한 조치 계획

### 1.6 FitGapAnalysis
전체적인 직무 적합도 요약 결과 모델이다.
* **summary** (`str`): 직무 적합성 매칭 총평
* **strong_fits** (`List[FitGapItem]`): 보유 역량이 직무에 강하게 부합하는 항목 리스트
* **partial_fits** (`List[FitGapItem]`): 부분적으로 부합하거나 경험 보완이 필요한 항목 리스트
* **gaps** (`List[FitGapItem]`): 현재 경험이 전혀 없어 신규 프로젝트에서 반드시 확보해야 할 역량 격차(Gap) 리스트
* **top_priorities** (`List[str]`): 우선적으로 보완 또는 강조해야 할 최우선순위 역량 강화 테마 리스트

### 1.7 WeeklyPlan
주차별 실행 및 학습 로드맵의 마일스톤이다.
* **week** (`int`): 주차 번호 (1-indexed)
* **goal** (`str`): 해당 주차의 실천 목표
* **detail** (`str`): 구체적인 학습 영역 및 프로젝트 개발 구현 상세 사항

### 1.8 Roadmap
추천 프로젝트 내용 및 로드맵 세부 사항이다.
* **recommended_project_title** (`str`): 지원자의 역량 격차(Gap)를 해결하기 위한 추천 프로젝트 제목
* **project_summary** (`str`): 추천 프로젝트 요약 설명
* **duration_weeks** (`int`): 프로젝트 수행 기간 (주의 희망 기간과 일치)
* **difficulty** (`str`): 프로젝트 수행 난이도 ("상", "중", "하" 중 하나)
* **reason_for_recommendation** (`str`): 이 프로젝트를 추천하는 구체적인 타당성/이유
* **weekly_plan** (`List[WeeklyPlan]`): 주차별 마일스톤 계획서
* **portfolio_outputs** (`List[str]`): 프로젝트 완료 후 확보할 수 있는 포트폴리오 산출물 목록
* **resume_reflection_points** (`List[str]`): 자기소개서에 녹여낼 수 있는 핵심 기술적 어필 포인트 리스트
* **interview_questions** (`List[str]`): 본 프로젝트와 관련된 예상 기술 면접 질문 리스트

### 1.9 RiskItem
지원서 서류 노출 위험 진단 단위 항목이다.
* **category** (`str`): 위험 진단 카테고리 ("개인정보 노출 위험", "미실행 계획의 완료 오인 위험", "허위 과장" 등)
* **description** (`str`): 감지된 리스크의 구체적인 내용 설명
* **severity** (`str`): 위험 심각도 ("상", "중", "하")
* **remedy** (`str`): 위험 요소를 수정하고 보완하기 위한 방안 가이드

### 1.10 RiskCheckResult
리스크 감사 전체 결과 보고서 모델이다.
* **overall_risk_level** (`str`): 종합 위험도 진단 수준 ("안전", "주의", "위험" 중 선택)
* **risks** (`List[RiskItem]`): 감지된 세부 위험 리스트
* **safe_usage_note** (`str`): 이력서 및 로드맵 작성 시 주의할 안전 가이드라인 권장 사항

### 1.11 ReferencedRagDocument
RAG 검색 프로세스를 통해 조회 및 참조된 Markdown 가이드 문서 규격이다.
* **title** (`str`): 가이드 문서의 제목
* **path** (`str`): 가이드 문서의 상대 경로 (예: `docs/skill_dictionary/rag.md`)
* **snippet** (`str`): 매칭된 핵심 텍스트 구절 요약 정보
* **score** (`float`): 문서 검색 유사도/매칭도 점수

### 1.12 JopFitResult
Streamlit UI로 전달되고 JSON으로 직렬화되는 최종 종합 출력 모델이다.
* **job_summary** (`str`): 채용공고 한 줄 요약
* **user_summary** (`str`): 사용자 경험 한 줄 요약
* **extracted_requirements** (`List[JobRequirement]`): 추출된 채용 요구사항 리스트
* **matched_experiences** (`List[str]`): 지원자 매칭 경험 목록
* **fit_gap_analysis** (`FitGapAnalysis`): 직무 적합도 요약 결과 객체
* **roadmap** (`Roadmap`): 추천 프로젝트 및 주차별 로드맵 객체
* **risk_checks** (`RiskCheckResult`): 서류 위험성 점검 결과 객체
* **evidence_coverage_rate** (`float`): 근거 증빙 충족 비율 (0.0 ~ 1.0)
* **final_note** (`str`): 지원자를 위한 종합 제언 및 격려의 말
* **referenced_rag_documents** (`List[ReferencedRagDocument]`): RAG 검색을 통해 연동된 Markdown 가이드 문서 정보 목록

---

## 2. LangGraph State Interface

### JopFitState (TypedDict)
LangGraph workflow 상의 노드들 간에 지속적으로 갱신되며 전달되는 공통 상태 데이터 규격이다.

```python
class JopFitState(TypedDict, total=False):
    user_input: UserInput                 # 사용자가 입력한 필드 모음
    use_llm: bool                         # 실제 OpenAI API 호출 여부 플래그
    validation_errors: list[str]          # 입력 데이터 검증 실패 사유 목록
    job_summary: str                      # 채용공고 핵심 요약 요약문
    user_summary: str                     # 지원자 경험 요약 요약문
    extracted_requirements: list          # 채용공고 핵심 요구사항 목록
    matched_experiences: list             # 지원자 매칭 경험 목록
    skill_docs: list[dict]                # 1차 직무/기술 RAG 참조 문서 목록
    fit_gap_analysis: Any                 # Fit-Gap 분석 결과 구조체
    project_docs: list[dict]              # 2차 프로젝트 템플릿 RAG 참조 문서 목록
    roadmap: Any                          # 추천 로드맵 정보 구조체
    risk_checks: Any                      # 리스크 검증 결과 구조체
    final_result: JopFitResult            # 최종 조합 완료된 출력 객체
    errors: list[str]                     # 파이프라인 진행 과정 중 발생한 오류 목록
```

---

## 3. Workflow Function Interfaces

### 3.1 run_graph_workflow
* **입력**: `user_input: UserInput`, `use_llm: bool = False`
* **출력**: `JopFitResult`
* **역할**: `StateGraph` 인스턴스를 빌드/컴파일하여 그래프 가상머신을 구동하고 초기 상태를 호출(`invoke`)한다.

### 3.2 run_mock_workflow
* **입력**: `user_input: UserInput`
* **출력**: `JopFitResult`
* **역할**: `run_graph_workflow(user_input, use_llm=False)`를 호출하여 API Key 없이 고정 샘플 데이터셋으로 실행한다.

### 3.3 run_llm_workflow
* **입력**: `user_input: UserInput`
* **출력**: `JopFitResult`
* **역할**: `run_graph_workflow(user_input, use_llm=True)`를 호출하여 실제 OpenAI LLM 호출을 기반으로 실행한다.

---

## 4. Graph Nodes Input & Output Specification

각 노드는 `JopFitState`를 전달받고 일부 필드를 추가/갱신하여 가공된 `JopFitState`를 반환한다.

| Node Name | Read Fields (입력 값) | Write Fields (출력 값) |
| :--- | :--- | :--- |
| **validate_input** | `user_input` | `validation_errors` |
| **analyze_job** | `user_input`, `use_llm` | `job_summary`, `extracted_requirements` |
| **analyze_profile** | `user_input`, `use_llm` | `user_summary`, `matched_experiences` |
| **retrieve_skill_docs** | `user_input` | `skill_docs` |
| **analyze_fit_gap** | `job_summary`, `extracted_requirements`, `user_summary`, `matched_experiences`, `use_llm` | `fit_gap_analysis` |
| **retrieve_project_templates** | `fit_gap_analysis`, `user_input` | `project_docs` |
| **generate_roadmap** | `fit_gap_analysis`, `skill_docs`, `project_docs`, `user_input`, `use_llm` | `roadmap` |
| **check_risks** | `user_input`, `roadmap` | `risk_checks` |
| **format_final_result** | 모든 갱신된 필드 및 RAG 데이터 | `final_result` |

---

## 5. evidence_coverage_rate 계산 규칙

근거 증빙 충족 비율(`evidence_coverage_rate`)은 LLM 모델에 위임하지 않으며, 신뢰성 보장을 위해 프로그램 코드 단에서 직접 연산한다.

* **수식**:
  $$evidence\_coverage\_rate = \frac{evidence가\ 비어있지\ 않은\ JobRequirement\ 개수}{전체\ JobRequirement\ 개수}$$
* **Python 구현**:
  ```python
  requirements = state["extracted_requirements"]
  non_empty = sum(1 for req in requirements if req.evidence.strip())
  total = len(requirements)
  evidence_rate = float(non_empty) / total if total > 0 else 0.0
  ```

---

## 6. Error Handling 규칙

1. **입력 값 누락 예외**: 지원 직무(`position`), 채용공고(`job_posting`), 보유 기술스택(`tech_stack`)이 비어 있는 경우 `validate_input`에서 예외를 발생시키거나 `app.py` 단에서 이 버튼 클릭 직후 `st.warning` 처리하여 분석 실행을 원천 차단한다.
2. **LLM 응답 JSON 파싱 실패 대비**: OpenAI API 응답 데이터가 JSON 구조를 만족하지 않는 경우 `call_llm_json` 내부에서 1회 자가 교정 프롬프트(Self-Correction Prompt)로 재시도한다. 그럼에도 파싱 실패 시, 시스템 충돌을 유발하는 대신 에러 내용이 기재된 딕셔너리(`{"error": "...", "details": "..."}`)를 반환한다.
3. **Pydantic 스키마 검증 예외**: API로 수신된 딕셔너리를 각 스키마 인스턴스로 변환(`model_validate` 등)할 때 발생하는 파싱 에러는 `st.error` 영역에 전달하여 사용자에게 친화적인 디버그 문구(Pydantic 검증 실패 상세 내용)를 표시하고 앱의 크래시를 방지한다.
