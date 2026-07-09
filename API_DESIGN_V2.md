# API Design V2

이 문서는 JobFit Roadmap Agent 시스템의 신규 로그인 및 사용자 데이터 영속 저장을 지원하기 위한 확장 API(V2) 명세서이다.
기존 가용 엔드포인트(`GET /api/health`, `POST /api/analyze`)는 하위 호환성을 위해 유지하며, 인증이 적용된 새로운 설계 규격을 정의한다.

---

## 1. API 공통 설계 원칙

* **인증 식별**: 모든 인증 요구 API는 `Authorization: Bearer <JWT_TOKEN>` 헤더를 검사한다. API 요청 본문(RequestBody)이나 쿼리 스트링으로 `user_id`를 임의 수집하지 않으며, 백엔드는 검증된 JWT Claim의 `sub` 필드로부터 유저를 식별한다.
* **표기 스타일**: 모든 필드명은 `snake_case` 방식을 유지한다.
* **타입 호환성**: 최종 매칭 결과 응답은 기존 프론트엔드 연동과의 호환을 보장하기 위해 `JopFitResult` Pydantic 모델의 형상을 그대로 따른다.
* **서비스 브랜딩**: 화면 및 대외 표기상 모든 서비스 로고 문구는 **JobFit Roadmap**으로 일원화한다.

---

## 2. Auth API (인증 및 계정 관리)

### 2.1 회원가입
* **Endpoint**: `POST /api/auth/register`
* **목적**: 새로운 사용자의 정보를 받아 계정을 생성한다.
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "홍길동"
  }
  ```
* **Response Body**:
  ```json
  {
    "success": true,
    "message": "회원가입이 완료되었습니다."
  }
  ```
* **Error Case**:
  * `400 Bad Request`: 이메일 형식이 유효하지 않거나 이미 존재하는 메일인 경우 (`{"detail": "이미 사용 중인 이메일 주소입니다."}`)

### 2.2 로그인
* **Endpoint**: `POST /api/auth/login`
* **목적**: 이메일/비밀번호를 확인하고 세션 서명 토큰을 발급한다.
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
* **Response Body**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer"
  }
  ```
* **Error Case**:
  * `401 Unauthorized`: 계정 또는 비밀번호가 불일치하는 경우 (`{"detail": "이메일 또는 비밀번호가 올바르지 않습니다."}`)

### 2.3 현재 로그인 사용자 정보 조회
* **Endpoint**: `GET /api/auth/me`
* **목적**: 토큰을 검증해 인가된 현재 사용자 계정 정보를 조회한다. (Headers: `Authorization: Bearer <JWT>`)
* **Response Body**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "created_at": "2026-07-09T09:00:00"
  }
  ```
* **Error Case**:
  * `401 Unauthorized`: 인증 만료 혹은 유효하지 않은 JWT 헤더인 경우

---

## 3. Experience API (보유 이력 관리)

모든 API는 JWT 인증 토큰 지참이 필수이며, 자기 자신의 리소스만 반환/제어한다.

### 3.1 경험 추가
* **Endpoint**: `POST /api/experiences`
* **Request Body**:
  ```json
  {
    "title": "백엔드 개발 동아리 활동",
    "description": "Django를 활용한 게시판 백엔드 개발 주도",
    "start_date": "2025-03-01",
    "end_date": "2025-06-30"
  }
  ```
* **Response Body**:
  ```json
  {
    "id": 101,
    "title": "백엔드 개발 동아리 활동",
    "description": "Django를 활용한 게시판 백엔드 개발 주도",
    "start_date": "2025-03-01",
    "end_date": "2025-06-30"
  }
  ```

### 3.2 경험 목록 조회
* **Endpoint**: `GET /api/experiences`
* **Response Body**:
  ```json
  [
    {
      "id": 101,
      "title": "백엔드 개발 동아리 활동",
      "description": "Django를 활용한 게시판 백엔드 개발 주도",
      "start_date": "2025-03-01",
      "end_date": "2025-06-30"
    }
  ]
  ```

### 3.3 경험 상세 조회
* **Endpoint**: `GET /api/experiences/{experience_id}`

### 3.4 경험 수정
* **Endpoint**: `PUT /api/experiences/{experience_id}`
* **Request Body**: 수정할 필드 모음.

### 3.5 경험 삭제
* **Endpoint**: `DELETE /api/experiences/{experience_id}`

---

## 4. Project API (프로젝트 이력 관리)

경험 API와 동일한 CRUD 형식을 유지한다.

* **POST /api/projects**: 프로젝트 추가
* **GET /api/projects**: 내 프로젝트 목록 조회
* **GET /api/projects/{project_id}**: 프로젝트 단일 상세 조회
* **PUT /api/projects/{project_id}**: 프로젝트 데이터 수정
* **DELETE /api/projects/{project_id}**: 프로젝트 데이터 삭제

---

## 5. ResumeDraft API (자기소개서 초안 관리)

* **POST /api/resume-drafts**: 자소서 초안 생성
* **GET /api/resume-drafts**: 내 자소서 초안 목록
* **GET /api/resume-drafts/{draft_id}**: 자소서 상세
* **PUT /api/resume-drafts/{draft_id}**: 자소서 수정
* **DELETE /api/resume-drafts/{draft_id}**: 자소서 삭제

---

## 6. Preferred Company / Role API (관심 회사 및 직무 관리)

### 6.1 관심 기업 등록
* **Endpoint**: `POST /api/preferred-companies`
* **Request Body**:
  ```json
  {
    "company_name": "네이버",
    "industry": "IT 서비스",
    "job_posting_summary": "네이버 백엔드 플랫폼 부문 신입 채용 공고 본문 내용 요약..."
  }
  ```
* **Response Body**: 등록 성공 및 고유 식별 코드 반환.

### 6.2 관심 직무 등록
* **Endpoint**: `POST /api/preferred-roles`
* **Request Body**:
  ```json
  {
    "role_name": "AI 백엔드 엔지니어"
  }
  ```

---

## 7. Analysis API (직무 분석 히스토리 관리)

### 7.1 실시간 일회성 분석 (하위 호환성 유지)
* **Endpoint**: `POST /api/analyze`
* **설명**: 인증 헤더 유무와 무관하게 작동하는 일회성 분석 엔드포인트 (기존 UI 동작 방식 보존).

### 7.2 로그인 사용자 맞춤 분석 및 기록 자동 저장
* **Endpoint**: `POST /api/analyses`
* **목적**: 현재 로그인된 사용자의 저장된 경험/프로젝트/자소서 데이터를 기반으로 분석을 가동하고 결과를 `analysis_histories`에 자동 보관한다.
* **Request Body**:
  ```json
  {
    "position": "AI 서비스 백엔드 인턴",
    "job_posting": "Python API 개발, RAG 우대...",
    "desired_duration": 6,
    "weekly_hours": 15,
    "goal": "포트폴리오 제작",
    "use_mock": true,
    "api_key": ""
  }
  ```
* **Response Body**: `JopFitResult` JSON과 생성된 `analysis_id` 반환.

### 7.3 내 분석 리포트 목록 조회
* **Endpoint**: `GET /api/analyses`
* **Response Body**:
  ```json
  [
    {
      "analysis_id": 501,
      "title": "[네이버] AI 서비스 백엔드 인턴 분석 리포트",
      "position": "AI 서비스 백엔드 인턴",
      "created_at": "2026-07-09T09:20:00"
    }
  ]
  ```

### 7.4 분석 리포트 상세 조회 (이전 결과 다시보기)
* **Endpoint**: `GET /api/analyses/{analysis_id}`
* **Response Body**: 저장된 `result_json` (`JopFitResult`) 데이터 그대로 출력.

### 7.5 분석 기록 삭제
* **Endpoint**: `DELETE /api/analyses/{analysis_id}`

---

## 8. Roadmap API (로드맵 및 주간 과제 제어)

### 8.1 분석 이력으로부터 고유 로드맵 생성 및 저장
* **Endpoint**: `POST /api/roadmaps/from-analysis/{analysis_id}`
* **목적**: 분석 결과의 주차별 로드맵 데이터(`weekly_plan`)를 개별 주차 할 일(`roadmap_tasks`) 테이블 데이터로 분할 변환하여 영속 저장한다.
* **Response Body**:
  ```json
  {
    "roadmap_id": 701,
    "title": "AI 서비스 백엔드 인턴 준비 로드맵",
    "duration_weeks": 6,
    "status": "doing"
  }
  ```

### 8.2 활성화된 내 로드맵 목록 조회
* **Endpoint**: `GET /api/roadmaps`

### 8.3 특정 로드맵 상세 및 주차별 할 일 상세 조회
* **Endpoint**: `GET /api/roadmaps/{roadmap_id}`
* **Response Body**: 로드맵 마스터 필드 및 주차별 할 일 목록(`roadmap_tasks`) 배열 반환.

### 8.4 주차별 할 일 상태(Status) 변경
* **Endpoint**: `PATCH /api/roadmaps/{roadmap_id}/tasks/{task_id}`
* **Request Body**:
  ```json
  {
    "status": "done" // todo, doing, done, skipped 중 하나
  }
  ```

### 8.5 로드맵 포기 및 삭제
* **Endpoint**: `DELETE /api/roadmaps/{roadmap_id}`

---

## 9. Notification API (알림 서비스)

### 9.1 활성화된 내 미독 알림 리스트 조회
* **Endpoint**: `GET /api/notifications`

### 9.2 알림 수신 읽음(Read) 완료 마킹
* **Endpoint**: `PATCH /api/notifications/{notification_id}/read`

---

## 10. Recommendation API (확장 추천 에이전트 인터페이스)

### 10.1 보유 역량 기반 추천 직무 조회
* **Endpoint**: `POST /api/recommend/roles`
* **Response Body**: 추천 직무군 리스트 및 적합 사유, 보완 필요 핵심 스택 기술.

### 10.2 관심 도메인 기반 추천 기업 조회
* **Endpoint**: `POST /api/recommend/companies`

### 10.3 다음 커리어 로드맵 추천
* **Endpoint**: `POST /api/recommend/next-roadmap`

---

## 11. URL RAG API (P2 등급: 외부 수집 자료실)

### 11.1 특정 URL 공고 내용 RAG 파싱 및 소스 적재
* **Endpoint**: `POST /api/rag/url`
* **Request Body**:
  ```json
  {
    "url": "https://recruit.navercorp.com/recruit/board/detail/..."
  }
  ```

### 11.2 내가 수집한 RAG 문서 리스트 조회
* **Endpoint**: `GET /api/rag/sources`

### 11.3 특정 RAG 문서 삭제
* **Endpoint**: `DELETE /api/rag/sources/{source_id}`
