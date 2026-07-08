# 🎯 JopFit Roadmap Agent MVP

JopFit Roadmap Agent는 취업 준비생과 이직 준비자를 위한 **채용공고 기반 직무 Fit-Gap 분석 및 맞춤형 프로젝트 로드맵 설계 AI Agent MVP**입니다.

이 프로젝트는 기존 Streamlit 기반의 데모 버전과, 새롭게 추가된 **React + TypeScript 프론트엔드 및 FastAPI 백엔드**로 구성된 모던 웹 서비스 아키텍처를 지원합니다.

---

## 1. 프로젝트 목적 (Project Purpose)
지원 직무, 채용공고, 자소서 초안, 기술 스택 등을 입력받아 직무 요구사항과 보유 경력의 차이(Fit-Gap)를 정밀 분석합니다. 이를 바탕으로 부족한 역량을 보충하기 위해 희망 기간(4주, 6주, 8주) 내에 수행할 수 있는 실천적인 프로젝트 마일스톤과 포트폴리오 산출물 로드맵을 제공하고 개인정보 및 서류 위험 요소를 탐지합니다.

---

## 2. 개발 단계 및 실행 모드 (Phases & Run Modes)
* **Mock 모드 (`use_mock=true`)**
  * OpenAI API 키 없이 로컬 샘플 데이터셋으로 실행할 수 있는 모드입니다.
  * 신속한 UI/UX 시연과 동작 흐름 파악에 최적화되어 있습니다.
* **실제 LLM 분석 모드 (`use_mock=false`)**
  * 실제 입력 값을 바탕으로 GPT 모델을 호출해 구조화된 취업 로드맵 분석 결과를 도출합니다.
  * OpenAI API 키가 필요하며, 입력창 또는 환경 변수에 정상 등록되어 있어야 동작합니다.
* **LangGraph StateGraph 아키텍처**:
  * 백엔드 분석 엔진은 `langgraph.graph.StateGraph`를 기반으로 설계 및 컴파일(`compile()`)되어 호출(`invoke()`)되는 실제 LangGraph 워크플로우로 동작합니다.

---

## 3. 설치 및 실행 방법 (How to Install & Run)

### 3.1 백엔드 API 서버 (FastAPI Backend)

1. **가상환경 구성 및 활성화**:
   ```bash
   python -m venv .venv
   
   # Windows (PowerShell)
   .venv\Scripts\Activate.ps1
   
   # macOS / Linux
   source .venv/bin/activate
   ```

2. **의존성 패키지 설치**:
   ```bash
   pip install -r requirements.txt
   ```

3. **백엔드 서버 구동**:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   * 백엔드는 기본적으로 `http://localhost:8000`에서 실행됩니다.

---

### 3.2 프론트엔드 앱 (React + TypeScript Frontend)

1. **의존성 설치**:
   ```bash
   cd frontend
   npm install
   ```

2. **개발 서버 구동**:
   ```bash
   npm run dev
   ```
   * 웹 브라우저에서 `http://localhost:5173`으로 접속할 수 있습니다.

---

### 3.3 레거시 데모 (Streamlit Legacy)
기존의 Streamlit 단독 애플리케이션도 테스트 및 데모용으로 여전히 정상 가동됩니다.
```bash
streamlit run app.py
```

---

## 4. 구현 기능 명세
* **FastAPI 백엔드 라우터**: `GET /api/health` 및 `POST /api/analyze` 구현.
* **SaaS 타입 UI/UX**: 다크 테마 기반 2열 구조 레이아웃 (좌측 입력 폼 / 우측 카드형 대시보드).
* **Fit-Gap 분석 테이블**: 적합 조건 상태별 등급 배지 표시.
* **로드맵 수직 타임라인**: 단계별 주차 목표 및 세부 사항 시각화.
* **서류 리스크 점검**: 민감한 개인 정보(이메일, 휴대폰 번호, 주민번호) 및 미래 계획의 완료형 어조 위험 검출.
* **JSON 분석 파일 저장**: 분석 결과를 로컬 JSON 형식 파일로 즉시 다운로드 제공.
