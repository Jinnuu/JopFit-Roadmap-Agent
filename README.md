# 🎯 JobFit Roadmap Agent MVP

JobFit Roadmap Agent는 취업 준비생과 이직 준비자를 위한 **채용공고 기반 직무 Fit-Gap 분석 및 맞춤형 프로젝트 로드맵 설계 AI Agent MVP**입니다.

이 프로젝트는 기존 Streamlit 기반의 데모 버전과, 새롭게 추가된 **React + TypeScript 프론트엔드 및 FastAPI 백엔드**로 구성된 모던 웹 서비스 아키텍처를 지원합니다.

---

## 1. 프로젝트 목적 (Project Purpose)
지원 직무, 채용공고, 자소서 초안, 기술 스택 등을 입력받아 직무 요구사항과 보유 경력의 차이(Fit-Gap)를 정밀 분석합니다. 이를 바탕으로 부족한 역량을 보충하기 위해 희망 기간(4주, 6주, 8주) 내에 수행할 수 있는 실천적인 프로젝트 마일스톤과 포트폴리오 산출물 로드맵을 제공하고 개인정보 및 서류 위험 요소를 탐지합니다.

---

## 2. 개발 단계 및 실행 모드 (Phases & Run Modes)
* **기본 웹 UI 작동 (Mock 모드)**
  * 일반 사용자 화면은 기본적으로 샘플 데이터셋 기반의 Mock 모드로 동작합니다.
  * API 서버 호출(`use_mock=true`)을 통해 신속한 시연과 레이아웃 흐름 파악을 제공합니다.
* **OpenAI LLM 개발자 모드**
  * 프론트엔드에서 실제 OpenAI API 연동 테스트를 활성화하려면 `frontend/.env` 파일에 아래 내용을 기재해야 합니다.
    ```env
    VITE_ENABLE_LLM_MODE=true
    ```
  * 그 후 프론트엔드 개발 서버를 재시작(`npm run dev`)하면 폼 카드 하단에 **개발자 설정** 패널이 노출됩니다.
  * 개발자 설정에서 '실제 LLM 분석 사용' 체크박스를 켜고 OpenAI API Key를 기입하여 요청을 전송하면 실제 LLM 모델을 바탕으로 한 동적 로드맵 분석 결과가 실행됩니다.
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

   * **안정 실행 (추천)**:
     ```bash
     uvicorn backend.main:app --port 8000
     ```

   * **개발용 reload**:
     ```bash
     uvicorn backend.main:app --reload --reload-dir backend --reload-dir src --reload-dir docs --port 8000
     ```
     > **[주의]** Windows 환경에서 `--reload` 옵션이 프로젝트 전체 디렉토리를 감시하면 `.venv/lib64` 등 가상 환경 내부 라이브러리를 스캔하는 도중 `WinError 1920` 접근 권한 오류가 발생할 수 있습니다. 이를 방지하기 위해 `--reload-dir`을 통해 감시 폴더를 backend, src, docs 등으로 명시 제한하여 안정적으로 개발 모드를 실행할 수 있습니다.

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
* **SaaS 타입 UI/UX**: 중앙 입력 카드 구조와 분석 결과 모달 레이어 리포트 제공.
* **Fit-Gap 분석 테이블**: 적합 조건 상태별 등급 배지 표시.
* **로드맵 수직 타임라인**: 단계별 주차 목표 및 세부 사항 시각화.
* **서류 리스크 점검**: 민감한 개인 정보(이메일, 휴대폰 번호, 주민번호) 및 미래 계획의 완료형 어조 위험 검출.
* **결과 파일로 저장**: 분석 결과를 로컬 JSON 형식 파일 및 PDF 형식으로 저장할 수 있도록 지원.
