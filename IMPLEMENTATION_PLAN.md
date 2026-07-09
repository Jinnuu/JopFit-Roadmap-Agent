# 구현 단계 계획서

이 문서는 JobFit Roadmap Agent MVP의 완성 이후, 데이터베이스 연동, 로그인 인증 흐름 및 개인화된 로드맵 할 일 추적과 알림 기능 확장을 위해 정의된 각 개발 페이즈(Phase)별 세부 태스크, 구현 우선순위 및 성공 기준을 기술한 마스터 계획서이다.

---

## 1. 구현 페이즈 계획 (Development Phases)

### Phase 0. 현재 상태 정리 및 환경 정비 (Clean & Align)
* **임시/추적 파일 청소**: 개발 과정에서 생성된 임시 스크립트나 빌드 잔여물, 백업 파일 등을 확인하고 정리한다.
* **`.gitignore` 설정 강화**: 가상환경 폴더(`.venv`), IDE 설정 디렉토리(`.vscode`), 프론트 빌드 결과물(`dist`), 임시 캐시(`.pycache`, `.eslintcache`), 로컬 환경 변수 설정 파일(`.env`, `frontend/.env`)이 깃 버전 관리에 오버랩되어 업로드되지 않도록 최적화한다.
* **표기 표준화**: 소스 코드(변수명 및 데이터 스키마 타입 제외) 및 화면 뷰 단어, 가이드 문서 내의 "JopFit" 표현을 모두 **JobFit** 브랜딩으로 일관되게 정정한다.
* **문서 동기화**: `README.md`, `ARCHITECTURE.md`, `WORKFLOW.md`를 최신 설계 내용(예: 새 창 PDF 인쇄, 개발자 모드 복구)에 맞춰 전면 일원화한다.

### Phase 1. DB 인프라 및 사용자 인증 토대 구축 (DB & Auth Foundation)
* **PostgreSQL 구성**: 로컬 또는 클라우드 PostgreSQL 서버 인스턴스를 마련하고 연동 자격 증명을 설정한다.
* **SQLAlchemy 매핑**: `users` 및 `user_profiles` 모델 클래스를 설계한다.
* **Alembic 설정**: 마이그레이션 툴을 초기화(`alembic init`)하고 초기 베이스라인 마이그레이션 스크립트를 빌드하여 적용한다.
* **회원 가입 및 로그인 엔드포인트 구현**: `POST /api/auth/register`, `POST /api/auth/login` 핵심 라우터를 작성하고 `bcrypt` 비밀번호 해시 로직을 도입한다.
* **JWT 인가 미들웨어 연동**: `GET /api/auth/me`를 완성하고, 토큰 검증 장치(Dependency Injection)를 작성하여 인가 헤더 유무를 평가하는 미들웨어를 구축한다.

### Phase 2. 사용자 핵심 이력 데이터 CRUD 구현 (User Profile Data)
* **이력 테이블 정의**: `experiences` (이력), `projects` (프로젝트), `resume_drafts` (자소서 초안) SQLAlchemy 스키마 작성 및 Alembic 반영.
* **CRUD API 엔드포인트 구현**: 각 테이블별 생성, 조회, 수정, 삭제 REST API 완성.
* **소유권 인가 제어**: SQL 빌더 시점에 `WHERE user_id = current_user_id` 조건을 필수 부여하여 데이터 프라이버시 격리를 완료한다.

### Phase 3. 직무 매칭 분석 이력 관리 (Analysis Preservation)
* **분석 테이블 정의**: `analysis_histories` 스키마 설계 및 Alembic 버전 업.
* **인증 호환형 분석 엔드포인트 추가**: `POST /api/analyses` 완성. (분석 노드를 순회하여 결과 `JopFitResult`를 뽑은 뒤 `input_snapshot` 및 `result_json`을 JSONB 타입으로 영속 저장한다.)
* **분석 아카이브 조회**: `GET /api/analyses` (목록) 및 `GET /api/analyses/{analysis_id}` (이전 분석 결과 복원) 작성.
* **하위 호환성 유지**: 기존의 비회원용 일회성 API인 `POST /api/analyze`는 건드리지 않고 원형대로 가동 유지한다.

### Phase 4. 로드맵 태스크 스케줄링 관리 (Roadmap Task Management)
* **로드맵 및 할 일 테이블 정의**: `roadmaps` 및 `roadmap_tasks` 스키마 작성.
* **일감 자동 변환 라우터 구현**: `POST /api/roadmaps/from-analysis/{analysis_id}`를 완성한다. (원문 분석 리포트의 `weekly_plan` 배열을 순회하며 주차 수에 맞게 `roadmap_tasks` 테이블에 레코드로 쪼개어 자동 삽입한다.)
* **상태 제어 API**: `PATCH /api/roadmaps/{roadmap_id}/tasks/{task_id}`를 통해 `todo`, `doing`, `done`, `skipped` 업데이트 연동을 지원한다.
* **대시보드 지표 렌더링**: 첫 화면 조회를 위해 이번 주 해야 할 태스크 및 미완료 일감 정보를 골라내는 전용 쿼리를 바인딩한다.

### Phase 5. 마일스톤 앱 내부 알림 연동 (In-App Notification)
* **알림 테이블 정의**: `notifications` 스키마 작성.
* **작업 마감 스케줄러**: 백그라운드 태스크나 Cron 작업을 이용해 작업 기한 만료 2일 전 미완료 대상 검출 로직 작성 및 알림 레코드 자동 생성 트리거.
* **알림 제어**: `GET /api/notifications`로 미독 목록을 화면에 렌더링하고, `PATCH /api/notifications/{id}/read`로 읽음 상태를 변경한다.

---

## 2. 개발 우선순위 (Prioritization Matrix)

효과적인 릴리즈를 위해 전체 요구 기능을 P0 (필수), P1 (중요), P2 (보완) 3단계 등급으로 나누어 순차 정렬한다.

### P0 (필수 구현 - MVP 직후 단계)
* **사용자 정보 관리**: `Auth`, `User`, `Experience`, `Project`, `ResumeDraft` 테이블 및 CRUD API.
* **분석 영속화**: `AnalysisHistory` 테이블 설계 및 이전 분석 리포트 다시보기 상세 API.
* **실천 관리 기반**: `Roadmap` 마스터 정보 및 주간 `RoadmapTask` 개별 쪼개기 변환 적재, 주간 일감 상태 업데이트 및 대시보드 출력.

### P1 (중요 구현 - 시스템 편의성 단계)
* **사용자 타깃 설정**: `preferred_companies` (관심 기업) 및 `preferred_roles` (관심 직무) 관리 기능.
* **인앱 통제**: 앱 내부 알림(`Notification` 테이블 및 실시간 대시보드 리마인드 팝업).
* **확장 에이전트 구축 (초기)**: `ProfileMemoryAgent` 및 `RoleRecommendationAgent` 규칙 기반(Rule-based) 알고리즘 중심 우선 조립.

### P2 (보완 구현 - 향후 연구 개발 단계)
* **외부 RAG 파이프라인**: URL 기반 공고 스크랩 연동 및 인제스트 파서 개발.
* **벡터 검색**: `pgvector` 라이브러리를 PostgreSQL에 장착하여 임베딩 기반 의미 검색(Semantic Search) 기능 이식.
* **심층 추천 에이전트**: 웹 검색 연동 및 심층 커리어 추천을 위한 LLM 에이전트 가동.

---

## 3. 성공 기준 (Success Criteria)

본 계획서에 기술된 아키텍처 개편이 완료되었다고 정의할 수 있는 핵심 정량/정성 평가 지표는 다음과 같다.

1. **인가 격리 성공**: 로그인한 사용자가 자신의 이력서 정보와 프로젝트를 작성하면 DB에 성공적으로 저장되며, 타인 토큰 접근 시 조회가 엄격히 거부(403 Forbidden)되어야 한다.
2. **리포트 재현성 확보**: 사용자가 과거에 수행했던 분석 기록 목록 중 하나를 클릭하면, 백엔드가 저장했던 스냅샷을 꺼내 기존 결과 페이지(`JopFitResult` 형상)와 정확히 일치하는 리포트 본문을 다시 렌더링해야 한다.
3. **일감화 및 추적 연동**: 분석이 끝난 시점에 "로드맵 도전" 버튼을 클릭하면, `weekly_plan`에 해당하는 갯수만큼 `roadmap_tasks` 테이블에 주차 데이터가 자동 삽입되어야 하며, 화면상에서 '진행 중 -> 완료' 토글 시 상태값이 데이터베이스에 즉시 동기화되어야 한다.
4. **일정 리마인드**: 금주 완료해야 하는 마감 대상이 있을 때, 대시보드 상단 미독 알림 개수가 정상 집계되고 알림 메시지에 마감 주차 명이 정확히 표시되어야 한다.
5. **추천 에이전트 정성 평가**: `ProfileMemoryAgent`가 저장된 프로젝트 및 기술 설명 텍스트를 파싱하여 도출한 '사용자 보유 스택 프로필'이 실제 지원자가 기입했던 정보와 의미적으로 일치해야 한다.
