# API Design V2

## 1. API 설계 원칙
* **인증 필수화**: `/api/auth` 하위 경로를 제외한 모든 사용자 데이터 관련 API는 HTTP Header에 올바른 JWT 토큰(`Authorization: Bearer <token>`)을 주입해야 합니다.
* **사용자 식별**: 클라이언트는 요청 바디(`request body`)나 쿼리 파라미터로 `user_id`를 전달하지 않습니다. 백엔드에서 JWT 토큰을 디코딩하여 검증한 뒤 요청 컨텍스트에서 `user_id`를 식별합니다.
* **표기 표준**: API 엔드포인트 경로, Request/Response Body 필드명은 모두 **snake_case**를 적용합니다.
* **호환성 유지**: 기존 단발성 분석 API인 `POST /api/analyze`는 하위 호환성을 위해 현재 포맷 그대로 남겨두며, 리턴 객체의 일부 타입명(`JopFitResult` 등)도 내부적 호환성을 위해 유지합니다.
* **명칭 통일**: 사용자에게 노출되는 화면상의 모든 문구는 서비스명인 **JobFit Roadmap**으로 일치시킵니다.

---

## 2. API Endpoints

### 2.1 Auth API

#### 2.1.1 POST `/api/auth/register`
* **목적**: 새로운 회원 계정을 생성하고 온보딩 프로필을 초기화합니다.
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "홍길동"
  }
  ```
* **Response Body (201 Created)**:
  ```json
  {
    "success": true,
    "message": "회원가입이 정상적으로 완료되었습니다.",
    "user": {
      "id": "e8a38c06-03a8-4228-8d2a-4a25301844b2",
      "email": "user@example.com",
      "name": "홍길동",
      "created_at": "2026-07-09T14:53:25Z"
    }
  }
  ```
* **Error Case**:
  - `400 Bad Request`: 이미 가입된 이메일인 경우 (`{"detail": "Email already registered"}`)
  - `422 Unprocessable Entity`: 비밀번호 강도 규격 미달 혹은 이메일 형식 오류

#### 2.1.2 POST `/api/auth/login`
* **목적**: 이메일과 비밀번호를 검증하고 세션 유지를 위한 JWT 토큰을 발급합니다.
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```
* **Error Case**:
  - `401 Unauthorized`: 이메일이 존재하지 않거나 패스워드가 틀린 경우 (`{"detail": "Invalid credentials"}`)

#### 2.1.3 GET `/api/me`
* **목적**: 현재 로그인된 사용자의 정보와 이력 상태 정보를 반환합니다.
* **Request Headers**: `Authorization: Bearer <JWT>`
* **Response Body (200 OK)**:
  ```json
  {
    "id": "e8a38c06-03a8-4228-8d2a-4a25301844b2",
    "email": "user@example.com",
    "profile": {
      "name": "홍길동",
      "current_job_title": "학생",
      "total_experience_months": 12
    }
  }
  ```

---

### 2.2 Experience API

#### 2.2.1 POST `/api/experiences`
* **목적**: 사용자의 신규 경력/경험 데이터를 등록합니다.
* **Request Body**:
  ```json
  {
    "title": "네이버 커넥트재단 부스트캠프",
    "category": "education",
    "start_date": "2025-01-01",
    "end_date": "2025-06-30",
    "description": "풀스택 웹 개발자 과정 수료 및 프로젝트 진행",
    "skills_gained": ["React", "Node.js", "System Design"]
  }
  ```
* **Response Body (201 Created)**:
  ```json
  {
    "id": "a50c8c93-9c88-4fb7-85e7-76ad06b83f21",
    "title": "네이버 커넥트재단 부스트캠프",
    "category": "education",
    "start_date": "2025-01-01",
    "end_date": "2025-06-30",
    "description": "풀스택 웹 개발자 과정 수료 및 프로젝트 진행",
    "skills_gained": ["React", "Node.js", "System Design"]
  }
  ```

#### 2.2.2 GET `/api/experiences`
* **목적**: 로그인한 사용자가 등록한 모든 경험 리스트를 조회합니다.
* **Response Body (200 OK)**:
  ```json
  [
    {
      "id": "a50c8c93-9c88-4fb7-85e7-76ad06b83f21",
      "title": "네이버 커넥트재단 부스트캠프",
      "category": "education",
      "start_date": "2025-01-01",
      "end_date": "2025-06-30"
    }
  ]
  ```

#### 2.2.3 GET `/api/experiences/{experience_id}`
* **목적**: 특정 경험 데이터의 상세 내용을 조회합니다.
* **Response Body (200 OK)**: 상세 정보 JSON 반환.

#### 2.2.4 PUT `/api/experiences/{experience_id}`
* **목적**: 기존 경험 데이터를 수정합니다. (Request Body는 POST와 동일)
* **Response Body (200 OK)**: 수정 완료된 경험 정보 반환.

#### 2.2.5 DELETE `/api/experiences/{experience_id}`
* **목적**: 특정 경험 데이터를 삭제합니다.
* **Response Body (204 No Content)**: 반환 바디 없음.

---

### 2.3 Project API

#### 2.3.1 POST `/api/projects`
* **목적**: 수행한 프로젝트를 상세 기록합니다.
* **Request Body**:
  ```json
  {
    "title": "분산 데이터 수집 파이프라인 구축",
    "role": "Data Engineer",
    "tech_stack": ["Python", "Kafka", "PostgreSQL"],
    "description": "IoT 기기들로부터 유입되는 원시 데이터를 병렬로 수집하는 모듈 개발",
    "contribution": "Kafka Consumer 그룹 구성 및 적재 속도 향상 설계",
    "outcomes": "기존 대비 적재 지연 시간 40% 감축",
    "project_url": "https://github.com/example/pipeline"
  }
  ```
* **Response Body (201 Created)**: 등록 성공 데이터 및 생성된 `id` 포함하여 응답.

*(프로젝트 조회 `GET /api/projects`, 단건 조회 `GET /api/projects/{project_id}`, 수정 `PUT /api/projects/{project_id}`, 삭제 `DELETE /api/projects/{project_id}` API는 동일한 CRUD 컨벤션을 유지합니다.)*

---

### 2.4 ResumeDraft API

#### 2.4.1 POST `/api/resume-drafts`
* **목적**: 자기소개서 질문과 답변 문항을 저장합니다.
* **Request Body**:
  ```json
  {
    "title": "2026 하반기 토스 백엔드 지원서",
    "question": "어려운 과제를 스스로 설정하고 극복한 경험을 기술하시오.",
    "answer": "대학교 시절 캡스톤 디자인에서 대용량 트래픽을 감당하는 서버를...",
    "target_company": "Toss"
  }
  ```
* **Response Body (201 Created)**: 생성 정보 응답.

*(자기소개서 CRUD도 동일한 GET, PUT, DELETE 메서드를 통신 형식으로 규정합니다.)*

---

### 2.5 Preferred Company & Role API

#### 2.5.1 POST `/api/preferences/companies`
* **목적**: 관심 타깃 기업을 저장합니다.
* **Request Body**:
  ```json
  {
    "company_name": "Toss",
    "industry": "Fintech",
    "memo": "유연한 조직 구조와 높은 기술적 도전이 매력적임"
  }
  ```
* **Response Body (201 Created)**: 생성된 UUID 및 상세 객체 반환.

#### 2.5.2 POST `/api/preferences/roles`
* **목적**: 희망하는 관심 직무와 가중치 순위를 저장합니다.
* **Request Body**:
  ```json
  {
    "role_name": "Python Backend Developer",
    "priority": 1
  }
  ```
* **Response Body (201 Created)**: 직무 저장 성공 확인 데이터 반환.

#### 2.5.3 POST `/api/preferences/job-postings`
* **목적**: 타깃 기업의 채용공고 원본 텍스트를 수집 보관합니다. (URL RAG 분석 또는 향후 RAG 연동용)
* **Request Body**:
  ```json
  {
    "company_name": "Toss",
    "position_title": "Backend Developer",
    "job_url": "https://toss.im/career/job-detail",
    "raw_text": "자격 요건: Python, Django 활용 능력... 우대 사항: MSA 개발 경험...",
    "deadline": "2026-08-31"
  }
  ```
* **Response Body (201 Created)**: 저장된 ID 포함 데이터 반환.

---

### 2.6 Analysis API

#### 2.6.1 POST `/api/analyses`
* **목적**: 사용자의 DB 프로필 데이터를 자동 수집하여, 넘겨받은 공고문과 비교한 뒤 분석을 수행하고 그 결과를 히스토리에 영구 저장합니다.
* **Request Body**:
  ```json
  {
    "company_name": "Toss",
    "position": "Backend Developer",
    "job_description": "모든 마이크로서비스의 게이트웨이 및 API 코어 개발 담당...",
    "mode": "llm" 
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "analysis_id": "b3e34b17-76a1-432a-bc96-1c095d315124",
    "status": "completed",
    "result": {
      "fit_score": 85,
      "fit_aspects": ["Python 웹 개발 숙련도", "PostgreSQL 인덱스 최적화 경험"],
      "gap_aspects": ["Docker 기반 배포 경험 부재", "Redis 캐싱 활용 경험 부족"],
      "roadmap": {
        "title": "Toss 백엔드 맞춤 보완 4주 로드맵",
        "weekly_plan": [
          {
            "week": 1,
            "goal": "Docker 기본 숙지 및 로컬 컨테이너 배포",
            "detail": "공식 튜토리얼을 완수하고, 기존 캡스톤 프로젝트 서버를 컨테이너화하여 로컬 실행 검증"
          }
        ]
      }
    }
  }
  ```

#### 2.6.2 GET `/api/analyses`
* **목적**: 로그인한 구직자가 실행했던 분석 히스토리 목록을 반환합니다.
* **Response Body (200 OK)**:
  ```json
  [
    {
      "analysis_id": "b3e34b17-76a1-432a-bc96-1c095d315124",
      "company_name": "Toss",
      "position": "Backend Developer",
      "created_at": "2026-07-09T14:53:25Z",
      "mode": "llm"
    }
  ]
  ```

#### 2.6.3 GET `/api/analyses/{analysis_id}`
* **목적**: 이전 분석 결과를 재조회합니다.
* **Response Body (200 OK)**: `POST /api/analyses` 성공 시 응답받았던 결과 JSON 원형(`result` 필드)을 반환합니다.

#### 2.6.4 DELETE `/api/analyses/{analysis_id}`
* **목적**: 분석 기록 데이터를 삭제합니다. (그로 인해 발생한 로드맵이 있다면 캐스케이드 삭제 방안 정의)

---

### 2.7 Roadmap API

#### 2.7.1 POST `/api/roadmaps/from-analysis/{analysis_id}`
* **목적**: AI 분석 결과의 `roadmap`을 토대로, 사용자가 진행할 주차별 실천 Task를 대시보드 스케줄에 생성 및 반영합니다.
* **Request Body**:
  ```json
  {
    "start_date": "2026-07-13"
  }
  ```
* **Response Body (201 Created)**:
  ```json
  {
    "roadmap_id": "11d1cfc9-ef1e-4589-a54f-124b1111956e",
    "title": "Toss 백엔드 맞춤 보완 4주 로드맵",
    "start_date": "2026-07-13",
    "status": "active",
    "tasks_created": 4
  }
  ```

#### 2.7.2 GET `/api/roadmaps`
* **목적**: 사용자가 진행 중이거나 과거 수행한 모든 로드맵의 마스터 리스트를 가져옵니다.
* **Response Body (200 OK)**:
  ```json
  [
    {
      "roadmap_id": "11d1cfc9-ef1e-4589-a54f-124b1111956e",
      "title": "Toss 백엔드 맞춤 보완 4주 로드맵",
      "status": "active",
      "start_date": "2026-07-13"
    }
  ]
  ```

#### 2.7.3 GET `/api/roadmaps/{roadmap_id}`
* **목적**: 특정 로드맵의 주차별 세부 태스크 상태 목록을 로드합니다.
* **Response Body (200 OK)**:
  ```json
  {
    "roadmap_id": "11d1cfc9-ef1e-4589-a54f-124b1111956e",
    "title": "Toss 백엔드 맞춤 보완 4주 로드맵",
    "tasks": [
      {
        "task_id": "55e2cfc9-ef1e-4589-a54f-124b1111956f",
        "week": 1,
        "title": "Docker 기본 숙지 및 로컬 컨테이너 배포",
        "detail": "공식 튜토리얼을 완수하고, 기존 캡스톤 프로젝트 서버를 컨테이너화하여 로컬 실행 검증",
        "due_date": "2026-07-19",
        "status": "doing"
      }
    ]
  }
  ```

#### 2.7.4 PATCH `/api/roadmaps/{roadmap_id}/tasks/{task_id}`
* **목적**: 로드맵 내 특정 실천 과제의 상태값(`todo` / `doing` / `done` / `skipped`)을 업데이트합니다.
* **Request Body**:
  ```json
  {
    "status": "done"
  }
  ```
* **Response Body (200 OK)**:
  ```json
  {
    "task_id": "55e2cfc9-ef1e-4589-a54f-124b1111956f",
    "status": "done",
    "updated_at": "2026-07-09T14:53:25Z"
  }
  ```

---

### 2.8 Notification API

#### 2.8.1 GET `/api/notifications`
* **목적**: 사용자가 읽지 않은 알림을 최우선으로 리스트업하여 가져옵니다.
* **Response Body (200 OK)**:
  ```json
  [
    {
      "notification_id": "99f3cfc9-ef1e-4589-a54f-124b1111956a",
      "title": "1주차 태스크 마감 임박",
      "message": "'Docker 기본 숙지' 태스크 마감이 오늘까지입니다. 진행 상태를 업데이트해 보세요.",
      "category": "task_deadline",
      "link_url": "/dashboard/roadmaps/11d1cfc9-ef1e-4589-a54f-124b1111956e",
      "is_read": false,
      "created_at": "2026-07-09T09:00:00Z"
    }
  ]
  ```

#### 2.8.2 PATCH `/api/notifications/{notification_id}/read`
* **목적**: 수신한 특정 알림을 읽음 완료(`is_read = true`) 처리합니다.
* **Response Body (200 OK)**: `{"success": true}`

---

### 2.9 Recommendation API

#### 2.9.1 POST `/api/recommend/roles`
* **목적**: 누적 저장된 경험 프로필 데이터 전체를 연산하여 추천 직무와 보완 추천사항을 응답합니다. (파라미터 없음, 토큰으로 식별)
* **Response Body (200 OK)**:
  ```json
  {
    "recommended_roles": [
      {
        "role_name": "Python Backend Developer",
        "match_score": 92,
        "reason": "소유하신 Fast API 프로젝트와 PostgreSQL 관리 지식은 본 직무 요구사항과 90% 이상 일치합니다.",
        "skills_to_improve": ["Redis", "Kubernetes"]
      }
    ]
  }
  ```

#### 2.9.2 POST `/api/recommend/companies`
* **목적**: 사용자 데이터를 기반으로 추천할 타깃 기업 유형과 준비 방향성을 제안합니다.
* **Response Body (200 OK)**:
  ```json
  {
    "recommended_company_types": [
      {
        "type": "기술 지향형 유니콘 스타트업",
        "reason": "주도적인 서비스 리팩토링 및 쿼리 최적화 성과는 오픈 컴퍼니 및 스타트업이 요구하는 인재상과 잘 어울립니다.",
        "strategies": ["기술 블로그 포스팅 작성으로 문제해결 능력 부각", "오픈소스 기여 경험 보완"]
      }
    ]
  }
  ```

#### 2.9.3 POST `/api/recommend/next-roadmap`
* **목적**: 현재 완료 단계에 다다른 로드맵 상태를 진단하여 차주 혹은 차단계에 시도해볼 만한 후속 로드맵 방향성을 피드백합니다.
* **Response Body (200 OK)**: 추천 로드맵 방향 JSON 리턴.

---

### 2.10 URL RAG API (P2 / 후기 확장 예정)

#### 2.10.1 POST `/api/rag/url`
* **목적**: 외부 URL을 스크래핑하여 사용자 RAG 소스로 등록합니다.
* **Request Body**:
  ```json
  {
    "url": "https://recruit.toss.im/career/job-detail?id=12345"
  }
  ```
* **Response Body (201 Created)**: 청킹된 개수와 소스 저장 ID 반환.

*(GET `/api/rag/sources`, GET `/api/rag/sources/{source_id}`, DELETE `/api/rag/sources/{source_id}` 등으로 RAG 전용 문서를 격리 보관 처리합니다.)*
