from src.schemas import JopFitResult, JobRequirement, FitGapItem, FitGapAnalysis, WeeklyPlan, Roadmap, RiskItem, RiskCheckResult, UserInput

def get_mock_result(user_input: UserInput) -> JopFitResult:
    duration = user_input.desired_duration if user_input.desired_duration in [4, 6, 8] else 6
    
    # 1. Extracted Requirements
    extracted_reqs = [
        JobRequirement(
            requirement="Python 기반 API 개발 경험",
            importance="상",
            evidence="Python 기반 API 개발 경험"
        ),
        JobRequirement(
            requirement="LLM API 활용 경험 우대",
            importance="상",
            evidence="LLM API 활용 경험 우대"
        ),
        JobRequirement(
            requirement="RAG 또는 Vector DB 경험 우대",
            importance="상",
            evidence="RAG 또는 Vector DB 경험 우대"
        ),
        JobRequirement(
            requirement="Docker 기반 배포 경험 우대",
            importance="중",
            evidence="Docker 기반 배포 경험 우대"
        ),
        JobRequirement(
            requirement="사용자 로그 기반 서비스 개선 경험 우대",
            importance="중",
            evidence="사용자 로그 기반 서비스 개선 경험 우대"
        ),
        JobRequirement(
            requirement="협업과 문서화를 중시하는 태도",
            importance="중",
            evidence=""  # Empty to demonstrate evidence coverage rate calculation
        )
    ]
    
    # 2. Matched Experiences
    matched_exps = [
        "Django와 MySQL 기반 식단·재고·발주 관리 웹서비스 개발 경험 (Python API 개발 경험 충족)",
        "Docker를 활용한 배포 경험 (Docker 기반 배포 경험 충족)",
        "식수 예측 모델 연동을 통한 ML 모델 인터페이스 구성 경험"
    ]
    
    # 3. Fit-Gap Analysis Items
    strong_fits = [
        FitGapItem(
            requirement="Python 기반 API 개발 경험",
            user_experience="Django 프레임워크를 사용한 백엔드 서버 구축 및 REST API 설계 경험 보유",
            status="Strong Fit",
            action_item="Django API 설계 역량을 Fast API / LangChain 개발에 전이하여 신속하게 LLM API 연동"
        ),
        FitGapItem(
            requirement="Docker 기반 배포 경험",
            user_experience="Docker 컨테이너를 빌드하고 환경을 배포한 실무 지식 보유",
            status="Strong Fit",
            action_item="RAG 백엔드 모듈 및 Vector DB(Chroma 등)를 Docker-compose로 멀티컨테이너 배포 환경으로 구성"
        )
    ]
    
    partial_fits = [
        FitGapItem(
            requirement="사용자 로그 기반 서비스 개선",
            user_experience="식수 예측 모델을 연동하여 웹서비스를 개발하고 배포했으나 로그 수집 인프라는 구축하지 않음",
            status="Partial Fit",
            action_item="신규 프로젝트 수행 시 로그 남기는 미들웨어를 구축하고, 이를 시각화 및 에러 트래킹에 적용하는 파트 추가"
        )
    ]
    
    gaps = [
        FitGapItem(
            requirement="LLM API 활용 및 RAG/Vector DB 개발 경험",
            user_experience="전통적인 ML 모델 예측 기능 연동 경험은 있으나 Generative AI / LLM API 및 RAG 패턴 적용 경험 없음",
            status="Gap",
            action_item="기존 웹서비스에 LangChain 및 OpenAI API를 활용한 RAG 기반 문서 검색 질의응답 기능 추가"
        )
    ]
    
    fit_gap_analysis = FitGapAnalysis(
        summary="사용자는 Python 웹 개발 및 Docker 배포 기본기가 탄탄하나, Generative AI 핵심 기술(LLM API, RAG, Vector DB) 및 로그 기반 분석 경험이 부족하여 이에 대한 보완 프로젝트가 필수적입니다.",
        strong_fits=strong_fits,
        partial_fits=partial_fits,
        gaps=gaps,
        top_priorities=[
            "LangChain / LlamaIndex 등을 이용한 LLM API 연동 프로젝트 수행",
            "Vector DB (Chroma, Qdrant 등)를 포함한 RAG 아키텍처 설계 및 구현",
            "사용자 입력 및 LLM 토큰 로그 수집 파이프라인 설계"
        ]
    )
    
    # 4. Weekly Roadmap Generation based on desired duration
    weekly_plans = []
    if duration == 4:
        weekly_plans = [
            WeeklyPlan(week=1, goal="RAG 시나리오 설계 및 환경 설정", detail="기존 Django 프로젝트 구조 분석, LangChain 연동 설계, Docker Compose에 Chroma DB 서비스 추가"),
            WeeklyPlan(week=2, goal="문서 전처리 및 Vector DB 구축", detail="사내 가이드북/메뉴얼 Markdown 파싱 및 Chunking 전략 구성, Chroma DB 임베딩 저장 기능 구현"),
            WeeklyPlan(week=3, goal="RAG 검색 & LLM API 구현", detail="LangChain Retriever 설정, OpenAI GPT-4o-mini API 연동 및 질의응답 비즈니스 로직 작성"),
            WeeklyPlan(week=4, goal="로깅 미들웨어 및 최종 검증", detail="API 응답 시간 및 사용자 질의 로그 저장 구현, Docker 통합 배포 및 README 작성")
        ]
    elif duration == 8:
        weekly_plans = [
            WeeklyPlan(week=1, goal="기존 프로젝트 분석 및 설계", detail="Django 아키텍처 분석, RAG 시나리오(사내 매뉴얼 검색) 정의 및 API 인터페이스 설계"),
            WeeklyPlan(week=2, goal="데이터 수집 및 전처리 파이프라인", detail="Markdown 및 PDF 문서 파싱, RecursiveCharacterTextSplitter 등을 이용한 청킹 실험"),
            WeeklyPlan(week=3, goal="Embedding 및 VectorStore 구축", detail="Chroma DB 구축, OpenAI text-embedding-3-small 모델 연동 및 데이터 색인 자동화"),
            WeeklyPlan(week=4, goal="Retriever 탐색 및 고도화", detail="MultiQueryRetriever 또는 ParentDocumentRetriever 적용을 통한 검색 성능 최적화"),
            WeeklyPlan(week=5, goal="LLM API 연동 및 LangChain 체인 완성", detail="PromptTemplate 설계 및 OpenAI gpt-4o-mini 호출, RAG 체인 구축"),
            WeeklyPlan(week=6, goal="LangGraph 도입 및 워크플로우 구성", detail="질의-검색-검증-응답 흐름을 LangGraph StateGraph로 구조화 및 예외 처리 구현"),
            WeeklyPlan(week=7, goal="로그 수집 및 모니터링 구축", detail="사용자 질의 및 LLM 답변, 토큰 소모량, 검색 점수를 저장하는 로깅 DB/미들웨어 설계"),
            WeeklyPlan(week=8, goal="Docker-compose 통합 및 README 작성", detail="전체 서비스를 Docker Compose로 묶어 배포 가능하게 구성, 상세 아키텍처 다이어그램 및 데모 비디오 작성")
        ]
    else:  # 6 weeks (default)
        weekly_plans = [
            WeeklyPlan(week=1, goal="기존 프로젝트 분석 및 RAG 설계", detail="기존 Django 프로젝트의 데이터 모델 분석 및 RAG(식단/재고 문서 질의응답) 유스케이스 정의"),
            WeeklyPlan(week=2, goal="문서 전처리 파이프라인 구성", detail="메뉴 정보, 발주 가이드라인 Markdown 문서화 및 Document Loader, TextSplitter를 이용한 청킹"),
            WeeklyPlan(week=3, goal="Embedding 및 Vector DB 구축", detail="Chroma DB를 활용한 로컬 벡터스토어 설정, text-embedding-3-small 임베딩 생성 및 저장"),
            WeeklyPlan(week=4, goal="Retriever 및 RAG API 구현", detail="LangChain QA 체인(RetrievalQA) 연동, gpt-4o-mini를 활용한 답변 생성 API 구현"),
            WeeklyPlan(week=5, goal="LangGraph 기반 워크플로우 구성", detail="질의 분석 및 검색 결과 적절성 평가 단계를 포함한 LangGraph 흐름 구축"),
            WeeklyPlan(week=6, goal="사용자 로그 분석 및 Docker 배포", detail="API 호출 로그 및 LLM 피드백 수집 모델 설계, Docker Compose 패키징 및 최종 포트폴리오 문서화")
        ]
        
    roadmap = Roadmap(
        recommended_project_title="기존 식단·발주 관리 웹서비스 내 RAG 기반 지능형 도우미 API 추가 개발",
        project_summary="기존의 CRUD 위주 Django 서비스에 LangChain, Chroma DB 및 OpenAI API를 결합하여 식단 가이드라인 및 재고 관리 규정 문서를 RAG 기반으로 조회하고 답변하는 챗봇/도우미 모듈을 추가합니다.",
        duration_weeks=duration,
        difficulty="중",
        reason_for_recommendation="사용자의 Django/Docker 기본 역량을 레버리지하여 단기간 내에 채용공고 우대사항인 LLM API 연동 및 RAG/Vector DB 기술을 완벽히 흡수할 수 있는 프로젝트입니다.",
        weekly_plan=weekly_plans,
        portfolio_outputs=[
            "GitHub Repository (RAG 모듈 코드 포함)",
            "System Architecture Diagram (Django - ChromaDB - OpenAI API 연동도)",
            "ChromaDB 임베딩 색인 파이프라인 스크립트",
            "주요 API Swagger 문서 및 테스트 케이스 결과서"
        ],
        resume_reflection_points=[
            "기존 CRUD 프로젝트에 RAG 기술을 도입하여 직무 부합도를 높인 기술적 의사결정 과정 강조",
            "동작 원리 분석을 통해 청킹 사이즈(Chunk Size)와 오버랩(Overlap) 조절로 검색 정확도를 향상시킨 경험 서술",
            "Docker Compose를 사용하여 백엔드 애플리케이션과 Vector DB를 통합 배포한 환경 구성 역량 어필"
        ],
        interview_questions=[
            "Q1. RAG 패턴을 사용할 때 검색(Retrieval) 성능을 높이기 위해 어떤 전략을 사용하셨나요?",
            "Q2. LLM 호출 시 발생할 수 있는 보안 문제(API Key 유출, 데이터 프라이버시)를 해결하기 위해 어떻게 설계하셨나요?",
            "Q3. Docker Compose 환경에서 Web App 컨테이너와 Vector DB 컨테이너 간의 통신 및 데이터 영속성은 어떻게 관리하셨습니까?"
        ]
    )
    
    # 5. Risk Checks
    # We will compute the risks dynamically or return a realistic set of risks
    # Also risk_checker will run rules. Let's return mock risks that match typical project risk checks.
    risks = [
        RiskItem(
            category="개인정보 노출 위험",
            description="자기소개서 초안에 포함된 특정 실명 또는 학번, 주민등록번호 형식의 텍스트가 탐지되었습니다.",
            severity="중",
            remedy="자기소개서 작성 시 구체적인 성명, 학번, 주민번호 등은 'OOO' 또는 공란으로 마스킹 처리하여 제출하십시오."
        ),
        RiskItem(
            category="미실행 계획의 완료 오인",
            description="로드맵의 'LangGraph 적용' 단계를 마치 이미 프로젝트에서 완전히 구현해본 완료 경험처럼 소개서에 기입할 위험이 있습니다.",
            severity="상",
            remedy="자기소개서에는 '향후 ~주간 ~한 단계를 거쳐 구현할 계획이며, 현재는 설계 검토 중'으로 작성해 미래 계획임을 확실히 명시하십시오."
        )
    ]
    
    risk_checks = RiskCheckResult(
        overall_risk_level="주의",
        risks=risks,
        safe_usage_note="본 AI가 제안한 로드맵은 직무 역량 보완을 위한 실행 가이드라인입니다. 자기소개서에 작성할 때는 '완료된 경험'이 아닌 '현재 계획 및 준비 단계'임을 정직하게 기술하여 신뢰성을 확보하십시오."
    )
    
    # Calculate Evidence Coverage Rate
    # evidence_coverage_rate = requirements with non-empty evidence / total requirements
    non_empty_evidences = sum(1 for req in extracted_reqs if req.evidence.strip())
    total_reqs = len(extracted_reqs)
    evidence_coverage = float(non_empty_evidences) / total_reqs if total_reqs > 0 else 0.0
    
    referenced_rag = [
        {
            "title": "RAG (Retrieval-Augmented Generation) 가이드라인",
            "path": "docs/skill_dictionary/rag.md",
            "snippet": "RAG는 외부 지식베이스(문서)를 활용하여 LLM의 할루시네이션을 방지하는 아키텍처 패턴입니다. Embedding 모델과 Vector Database(Chroma, FAISS)를 활용하여...",
            "score": 0.95
        },
        {
            "title": "AI 백엔드 인턴 직무 역량 사전",
            "path": "docs/job_roles/ai_backend.md",
            "snippet": "AI 서비스 백엔드 개발자는 전통적인 REST API 설계 역량뿐 아니라 LLM API 연동, 벡터 DB 색인, RAG 프레임워크 활용 능력이 요구됩니다.",
            "score": 0.88
        }
    ]
    
    return JopFitResult(
        job_summary="AI 서비스 백엔드 인턴 직무는 Python 기반 API 개발 능력을 기반으로 LLM API 활용, RAG 아키텍처 설계, Docker 배포, 그리고 사용자 로그 기반 서비스 개선 역량을 고루 갖춘 인재를 선호합니다.",
        user_summary="사용자는 Django와 MySQL 기반의 백엔드 서비스 개발 및 Docker 배포 실무 기본기를 갖추고 있으나, LLM 및 RAG 기반의 Generative AI 기능 구현 경험은 보유하고 있지 않은 신입 개발자입니다.",
        extracted_requirements=extracted_reqs,
        matched_experiences=matched_exps,
        fit_gap_analysis=fit_gap_analysis,
        roadmap=roadmap,
        risk_checks=risk_checks,
        evidence_coverage_rate=round(evidence_coverage, 2),
        final_note="기본적인 백엔드 및 Docker 개발 역량이 우수하므로, 로드맵을 실제로 수행하고 산출물을 정리하면 포트폴리오에서 설명할 수 있습니다.",
        referenced_rag_documents=referenced_rag
    )
