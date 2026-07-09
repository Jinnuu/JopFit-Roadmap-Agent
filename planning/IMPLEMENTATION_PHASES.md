# 구현 단계 계획서

## Phase 0. 현재 상태 정리 및 리팩토링
| 항목 | 상세 내용 |
| :--- | :--- |
| **목표** | 프로젝트 내 불필요한 설정 파일 정리 및 네이밍 불일치(JobFit vs JopFit)를 바로잡고 설계 문서를 최신화합니다. |
| **수정 대상 파일** | `.gitignore`, `README.md`, `docs/ARCHITECTURE.md`, `docs/WORKFLOW.md` |
| **새로 만들 파일** | `planning/` 하위 설계 문서 8종 |
| **API** | 해당 없음 |
| **DB** | 해당 없음 |
| **검증 방법** | git status 확인 및 프로젝트 전역에서 오타/표기 통일성(Grepping) 확인 |
| **완료 기준** | - `JopFit` 표기를 `JobFit Roadmap` 서비스명 및 파일명 제외 전반적 표기 통일<br>- 불필요한 캐시 및 로컬 환경변수 파일(.env 등)이 git 추적에서 제외됨 |

---

## Phase 1. DB 및 Auth 기반 인프라 구축
| 항목 | 상세 내용 |
| :--- | :--- |
| **목표** | PostgreSQL 데이터베이스 커넥션을 수립하고 회원 가입 및 JWT 기반 보안 인증 체계를 활성화합니다. |
| **수정 대상 파일** | `backend/config.py`, `backend/main.py` |
| **새로 만들 파일** | `backend/db/session.py`, `backend/models/user.py`, `backend/schemas/auth.py`, `backend/api/auth.py`, `backend/utils/security.py`, `backend/db/alembic/env.py` |
| **API** | - `POST /api/auth/register`<br>- `POST /api/auth/login`<br>- `GET /api/me` |
| **DB** | `users` 테이블, `user_profiles` 테이블 생성 (Alembic Migration 적용) |
| **검증 방법** | - `pytest` 활용 회원가입/로그인 통합 테스트 실행<br>- 포스트맨/Swagger UI에서 잘못된 패스워드 로그인 시 401 에러 체크<br>- 발급받은 Bearer Token으로 `/api/me` 호출하여 정상 사용자 데이터 반환 확인 |
| **완료 기준** | 회원가입한 사용자가 올바른 아이디/비밀번호로 인증 토큰을 발급받고 본인 프로필을 조회할 수 있음 |

---

## Phase 2. 사용자 데이터 CRUD 구현
| 항목 | 상세 내용 |
| :--- | :--- |
| **목표** | 사용자의 개인 이력 데이터(경험, 프로젝트, 자기소개서 초안) 및 관심 설정 정보를 관리하는 API를 작성합니다. |
| **수정 대상 파일** | `backend/main.py` (라우터 등록) |
| **새로 만들 파일** | `backend/models/experience.py`, `backend/models/project.py`, `backend/models/resume.py`, `backend/models/preference.py`, `backend/api/experiences.py`, `backend/api/projects.py`, `backend/api/resumes.py`, `backend/api/preferences.py` |
| **API** | - `GET /POST/PUT/DELETE /api/experiences` (및 단건)<br>- `GET /POST/PUT/DELETE /api/projects` (및 단건)<br>- `GET /POST/PUT/DELETE /api/resume-drafts` (및 단건)<br>- `POST /api/preferences/companies`<br>- `POST /api/preferences/roles` |
| **DB** | `experiences`, `projects`, `resume_drafts`, `preferred_companies`, `preferred_roles` 테이블 구축 |
| **검증 방법** | - 로그인 토큰 없이 요청 시 401 Unauthorized 검증<br>- 데이터 삽입 후 조회 시 요청한 `user_id` 레코드만 출력되는지 상호 격리 테스트 |
| **완료 기준** | 사용자가 로그인 후 본인의 프로젝트 2개와 경험 3개를 독립적으로 수정/삭제/조회 완료함 |

---

## Phase 3. 분석 기록 저장 API
| 항목 | 상세 내용 |
| :--- | :--- |
| **목표** | 기존 단발성 분석 API는 보존한 채, 로그인한 사용자의 분석 이력을 히스토리 테이블에 보관하고 다시 볼 수 있게 구현합니다. |
| **수정 대상 파일** | `backend/api/analyze.py` (또는 기존 분석 컨트롤러) |
| **새로 만들 파일** | `backend/models/analysis.py`, `backend/api/analyses.py`, `backend/schemas/analysis.py` |
| **API** | - `POST /api/analyses` (분석 후 자동 저장)<br>- `GET /api/analyses` (목록)<br>- `GET /api/analyses/{analysis_id}` (이전 분석 상세 조회)<br>- `DELETE /api/analyses/{analysis_id}` |
| **DB** | `analysis_histories`, `saved_job_postings` 테이블 구축 |
| **검증 방법** | - 공고 입력 후 `POST /api/analyses` 요청 시 DB에 JSONB 스냅샷이 온전히 기록되는지 확인<br>- 타인의 `analysis_id`로 접근 시 403 Forbidden 차단 검증 |
| **완료 기준** | 사용자가 분석 요청 완료 후 생성된 ID로 언제든 과거 분석 리포트 화면을 재호출하여 볼 수 있음 |

---

## Phase 4. Roadmap Task 관리 구현
| 항목 | 상세 내용 |
| :--- | :--- |
| **목표** | 분석 보고서의 텍스트 기반 로드맵 제안을 대시보드에서 직접 컨트롤할 수 있는 개별 To-Do 과제로 분해하여 관리합니다. |
| **수정 대상 파일** | `backend/main.py` |
| **새로 만들 파일** | `backend/models/roadmap.py`, `backend/api/roadmaps.py`, `backend/schemas/roadmap.py` |
| **API** | - `POST /api/roadmaps/from-analysis/{analysis_id}`<br>- `GET /api/roadmaps` (및 단건 상세)<br>- `PATCH /api/roadmaps/{roadmap_id}/tasks/{task_id}`<br>- `DELETE /api/roadmaps/{roadmap_id}` |
| **DB** | `roadmaps`, `roadmap_tasks` 테이블 구축 |
| **검증 방법** | - 로드맵 활성화 호출 시 4주 분량의 `roadmap_tasks`가 4건 이상 생성되는지 확인<br>- Task 상태 변경(`todo` -> `done`) 요청 후 대시보드 재조회 시 상태 업데이트 적용 확인 |
| **완료 기준** | 사용자가 로드맵 태스크 완료 처리 시 해당 태스크 상태가 DB 상에서 `done`으로 즉시 영속 처리됨 |

---

## Phase 5. 알림 시스템 구현
| 항목 | 상세 내용 |
| :--- | :--- |
| **목표** | 로드맵의 일정 상태를 모니터링하여 대시보드 알림을 실시간 생성하고 읽음 상태를 제어합니다. |
| **수정 대상 파일** | `backend/main.py` |
| **새로 만들 파일** | `backend/models/notification.py`, `backend/api/notifications.py`, `backend/services/notification_service.py` |
| **API** | - `GET /api/notifications`<br>- `PATCH /api/notifications/{notification_id}/read` |
| **DB** | `notifications` 테이블 구축 |
| **검증 방법** | - 임의의 마감 초과 태스크를 설정하고 스케줄 서비스 트리거 시 알림 테이블에 데이터 생성 여부 조회<br>- 읽음 처리 API 호출 후 안읽은 알림 목록 재조회 시 제외되는지 검증 |
| **완료 기준** | 사용자가 상단 알림 영역에서 읽음 표시를 눌렀을 때 읽음 처리가 정상 완료되며 안읽은 개수가 감축됨 |

---

## Phase 6. 추천 Agent 구현
| 항목 | 상세 내용 |
| :--- | :--- |
| **목표** | 축적된 경험 스택 프로필 정보를 종합 판독하여, 사용자에게 추천 직무 및 관심 기업 대비 준비 전략을 도출해 제공합니다. |
| **수정 대상 파일** | `backend/main.py` |
| **새로 만들 파일** | `backend/services/agents/recommend_agent.py`, `backend/api/recommendations.py` |
| **API** | - `POST /api/recommend/roles`<br>- `POST /api/recommend/companies`<br>- `POST /api/recommend/next-roadmap` |
| **DB** | 해당 없음 (경험/프로젝트 테이블 조회 위주) |
| **검증 방법** | - 경험 데이터가 0건인 상태에서 호출 시 빈 어레이 및 기본 피드백 체크<br>- 스택(예: Python, React)이 가득한 프로필 제출 시 백엔드/프론트엔드 맞춤 타겟이 도출되는지 결과물 검증 |
| **완료 기준** | 사용자가 추천 화면에 들어갔을 때 본인의 이력에 잘 매칭되는 추천직무 1건 이상과 매칭 이유가 가독성 있게 노출됨 |

---

## Phase 7. URL/RAG 확장 (P2 / 향후 구현)
| 항목 | 상세 내용 |
| :--- | :--- |
| **목표** | 사용자가 외부 URL을 전달 시 본문을 수집 청킹하여 개별 RAG 저장소에 관리하고 분석 시 지식 베이스로 참조되도록 파이프라인을 구축합니다. |
| **수정 대상 파일** | `backend/services/agents/analyze_agent.py` (기존 LangGraph) |
| **새로 만들 파일** | `backend/models/rag.py`, `backend/api/rag.py`, `backend/services/rag_processor.py` |
| **API** | - `POST /api/rag/url`<br>- `GET /api/rag/sources` (및 단건 상세)<br>- `DELETE /api/rag/sources/{source_id}` |
| **DB** | `rag_sources`, `rag_chunks` 테이블 구축 |
| **검증 방법** | - 외부 모의 HTML 페이지 주소 전달 시 노이즈 마크업 제거 및 청크 분절 정상 수행 테스트<br>- RAG 검색 시 쿼리한 키워드가 내포된 청크만 추출되어 LLM 프롬프트에 동적 삽입되는지 검증 |
| **완료 기준** | 사용자가 추가한 문서 조각 내용이 공고 분석서 피드백 내용에 실제로 가공/인용되어 출력됨 |

---

## Phase 8. 웹 검색 Agent 확장 (P2 / 향후 구현)
| 항목 | 상세 내용 |
| :--- | :--- |
| **목표** | 관심 기업의 최근 기술 블로그나 뉴스피드를 수집하여 로드맵에 기업 맞춤 최신 트렌드를 피드백합니다. |
| **수정 대상 파일** | `backend/services/agents/recommend_agent.py` |
| **새로 만들 파일** | `backend/services/agents/web_search_agent.py` |
| **API** | 해당 없음 (추천 API 내 탑재) |
| **DB** | 해당 없음 |
| **검증 방법** | - Tavily Search API 또는 유사 웹 검색 모듈의 응답 정상 바인딩 테스트<br>- 실시간 핫 토픽 기술 키워드가 추천 가이드라인 텍스트에 포함되어 출현하는지 대조 |
| **완료 기준** | 타깃 기업의 최근 신산업 스택 내용이 추천 피드백에 반영되어 출력됨 |

---

## 권장 구현 순서 체크리스트
프로젝트 진행을 맡은 구현자가 단계적으로 밟아가야 할 상세 마일스톤 순서입니다.

* [ ] **Phase 0. 리팩토링**
  * [ ] `.gitignore` 파일을 정비하여 `.env` 및 `.pytest_cache`, `venv` 등 빌드 찌꺼기 추적 제외
  * [ ] 기획 및 설계 문서 8종을 `planning/` 하위 폴더에 적재 완료
  * [ ] 코드 내 `JopFit` 표기 전역 검색 후 `JobFit`으로 수정 및 README 가이드 정비
* [ ] **Phase 1. DB/Auth 인프라**
  * [ ] PostgreSQL DB 연동 환경변수 설정 및 SQLAlchemy 엔진 구현
  * [ ] Alembic 초기화 및 회원/프로필(users, user_profiles) 테이블 마이그레이션 생성 및 DB 반영
  * [ ] 회원가입/로그인 컨트롤러 및 JWT 서명/디코드 유틸 함수 구현
  * [ ] Bearer Token 기반의 현재 로그인 사용자 식별 데코레이터 구현 및 `/api/me` 작동 테스트
* [ ] **Phase 2. 기본 사용자 데이터 API**
  * [ ] 경험(experiences) CRUD 컨트롤러 및 스키마 개발
  * [ ] 프로젝트(projects) CRUD 컨트롤러 및 스키마 개발
  * [ ] 자소서 초안(resume_drafts) CRUD 컨트롤러 개발
  * [ ] 관심 기업/직무(preferred_companies, preferred_roles) 저장 API 구현
* [ ] **Phase 3. 분석 이력 영속화**
  * [ ] `analysis_histories` 테이블 정의 및 마이그레이션 실행
  * [ ] 기존 `/api/analyze` 호출 로직을 유지하면서, 결과를 DB 히스토리에 기록하는 `/api/analyses` 엔드포인트 신설
  * [ ] 이전 내 분석 기록의 목록 및 상세 정보를 재로드하는 조회 엔드포인트 구현
* [ ] **Phase 4. 로드맵 태스크 일정 관리**
  * [ ] `roadmaps` 및 `roadmap_tasks` 테이블 마이그레이션 진행
  * [ ] 분석 상세 내역을 기반으로 주차별 Task를 생성하는 변환 알고리즘 및 컨트롤러 구현
  * [ ] 사용자가 태스크의 체크박스를 조작할 수 있는 `/api/roadmaps/{roadmap_id}/tasks/{task_id}` 패치 API 구현
* [ ] **Phase 5. 알림 엔진**
  * [ ] `notifications` 테이블 마이그레이션 진행
  * [ ] 마감일 임박 태스크 및 장기 미접속 자소서 업데이트 알림 자동 등록용 내부 서비스 클래스 작성
  * [ ] 안읽은 알림 조회 및 개별 읽음 처리 API 구현
* [ ] **Phase 6. AI 추천 Agent**
  * [ ] ProfileMemoryAgent 로직 구현 (사용자 이력 데이터를 요약 역량 템플릿으로 변출)
  * [ ] RoleRecommendationAgent / CompanyRecommendationAgent 설계 검증 및 API 연동 완료
  * [ ] 대시보드 추천 컴포넌트 프론트엔드 연계 테스트
* [ ] **Phase 7 ~ 8. URL RAG 및 웹 검색 확장 (P2 단계 진행)**
  * [ ] RAG 소스 및 청크 스키마 구현 및 pgvector/FTS 검색 로직 적용
  * [ ] Tavily 또는 Google Search 연계 실시간 기업동향 웹 검색 노드 통합
