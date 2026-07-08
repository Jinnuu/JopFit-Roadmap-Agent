# API_SPEC.md

# JopFit Roadmap Agent API Specification

이 문서는 React 프론트엔드와 FastAPI 백엔드 간의 데이터 통신을 위한 API 명세를 정의한다.

> **이 문서를 기준으로 백엔드 및 프론트엔드 API 통신을 구현한다.**

---

## 1. 개요
* **Backend 목적**: LangGraph StateGraph workflow를 API 엔드포인트로 노출하고, 사용자의 이력 정보를 분석하는 분석기 가동.
* **Frontend 목적**: 사용자 입력을 받아 FastAPI 백엔드로 요청을 보내고, 결과를 대시보드와 로드맵 타임라인 형태로 시각화.
* **CORS 정책**: 프론트엔드(기본 `http://localhost:5173`)로부터의 요청을 승인하기 위해 백엔드에서 CORS(Cross-Origin Resource Sharing) 허용.

---

## 2. API Endpoints

### 2.1 GET /api/health
백엔드 서버의 가동 상태를 점검하는 헬스체크 엔드포인트.

* **Response (Body)**:
  ```json
  {
    "status": "ok",
    "service": "jopfit-roadmap-agent"
  }
  ```

### 2.2 POST /api/analyze
사용자가 입력한 채용 정보 및 이력 초안을 바탕으로 매칭 분석 및 주차별 로드맵을 생성한다.

* **Request Body Schema (`AnalyzeRequest`)**:
  ```json
  {
    "position": "AI 서비스 백엔드 인턴",
    "job_posting": "Python API 개발, RAG 우대...",
    "company_values": "문제를 구조화하고 빠르게 실험하는 사람...",
    "resume_draft": "안녕하세요. 백엔드 개발자 지망생입니다...",
    "project_description": "Django와 MySQL 기반 웹서비스 개발...",
    "tech_stack": "Python, Django, MySQL, Docker",
    "desired_duration": 6,
    "weekly_hours": 15,
    "goal": "포트폴리오 제작",
    "use_mock": true,
    "api_key": ""
  }
  ```
  * `use_mock`: `true`일 경우 로컬 샘플 데이터셋으로 workflow를 가동하고, `false`일 경우 실제 OpenAI API를 호출한다.
  * `api_key`: `use_mock`이 `false`일 때 실제 OpenAI API를 호출하기 위해 입력받는 임시 API 키 (백엔드 세션 내에서만 적용되며 별도 저장되지 않음).

* **Response Body Schema (`JopFitResult`)**:
  ```json
  {
    "job_summary": "채용공고 핵심 요약 문구",
    "user_summary": "지원자 경험 요약 문구",
    "extracted_requirements": [
      {
        "requirement": "Python 기반 API 개발 경험",
        "importance": "상",
        "evidence": "Python 기반 API 개발 경험"
      }
    ],
    "matched_experiences": [
      "Django와 MySQL 기반 웹서비스 개발 경험 (API 개발 충족)"
    ],
    "fit_gap_analysis": {
      "summary": "Fit-Gap 매칭 총평 문구",
      "strong_fits": [
        {
          "requirement": "Python 기반 API 개발 경험",
          "user_experience": "Django 프레임워크를 사용한 백엔드 API 설계 경험 보유",
          "status": "Strong Fit",
          "action_item": "Django API 설계 역량을 FastAPI 및 LangChain에 전이"
        }
      ],
      "partial_fits": [],
      "gaps": [],
      "top_priorities": [
        "Vector DB 구축 및 RAG 설계"
      ]
    },
    "roadmap": {
      "recommended_project_title": "RAG 기반 지능형 도우미 추가 개발",
      "project_summary": "기존 웹서비스에 LangChain, Chroma DB를 결합...",
      "duration_weeks": 6,
      "difficulty": "중",
      "reason_for_recommendation": "보유 기술스택을 레버리지하기 좋은 환경...",
      "weekly_plan": [
        {
          "week": 1,
          "goal": "프로젝트 분석 및 RAG 설계",
          "detail": "Django 모델 분석 및 유스케이스 정의..."
        }
      ],
      "portfolio_outputs": [
        "GitHub Repository",
        "System Architecture Diagram"
      ],
      "resume_reflection_points": [
        "RAG 아키텍처 도입을 통한 문제 해결 과정 설명"
      ],
      "interview_questions": [
        "RAG 패턴의 검색 성능 튜닝 방안은?"
      ]
    },
    "risk_checks": {
      "overall_risk_level": "안전",
      "risks": [],
      "safe_usage_note": "개인정보는 마스킹 처리할 것을 권장합니다."
    },
    "evidence_coverage_rate": 0.83,
    "final_note": "로드맵을 성공적으로 완수하여 성과를 확보하시길 바랍니다.",
    "referenced_rag_documents": [
      {
        "title": "RAG 가이드라인",
        "path": "docs/skill_dictionary/rag.md",
        "snippet": "RAG는 외부 지식을 활용하여...",
        "score": 0.95
      }
    ]
  }
  ```

* **Error Response Schema (`AnalyzeErrorResponse`)**:
  HTTP 상태코드 `400` 또는 `500`으로 응답 시 사용된다.
  ```json
  {
    "error": "분석 실행 중 에러가 발생했습니다",
    "details": "에러 상세 원인 설명 또는 Pydantic 검증 실패 상세 내용"
  }
  ```

---

## 3. 프론트엔드 연동 가이드
* **타입 매핑**: 백엔드 Pydantic schema 필드의 `snake_case` 구조를 프론트엔드 TypeScript interface에서 100% 동일하게 유지해야 한다. (`position`, `job_posting`, `company_values` 등)
* **API Key 보안**: 프론트엔드는 수집된 `api_key`를 분석 요청 API의 Request Body에 포함해 실시간 전송하되, 브라우저의 `localStorage` 나 `sessionStorage` 에 영속적으로 저장해서는 안 된다.
