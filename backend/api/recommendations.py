from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.user import User
from backend.models.experience import Experience
from backend.models.project import Project
from backend.models.resume import ResumeDraft
from backend.deps import get_current_user

router = APIRouter(prefix="/api/recommend", tags=["recommendations"])

def extract_keywords_from_user(current_user: User, db: Session) -> str:
    # Gather all text content to analyze
    exps = db.query(Experience).filter(Experience.user_id == current_user.id).all()
    projs = db.query(Project).filter(Project.user_id == current_user.id).all()
    resumes = db.query(ResumeDraft).filter(ResumeDraft.user_id == current_user.id).all()

    text_parts = []
    for exp in exps:
        text_parts.append(exp.title)
        text_parts.append(exp.description)
        if exp.skills_gained:
            text_parts.extend(exp.skills_gained)
    
    for proj in projs:
        text_parts.append(proj.title)
        text_parts.append(proj.role)
        text_parts.append(proj.description)
        text_parts.append(proj.contribution)
        if proj.outcomes:
            text_parts.append(proj.outcomes)
        if proj.tech_stack:
            text_parts.extend(proj.tech_stack)
            
    for res in resumes:
        text_parts.append(res.title)
        text_parts.append(res.question)
        text_parts.append(res.answer)
        if res.target_company:
            text_parts.append(res.target_company)

    return " ".join(text_parts).lower()

@router.post("/roles")
def recommend_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    text = extract_keywords_from_user(current_user, db)
    
    # Simple rule based checks
    rules = [
        {
            "title": "백엔드 개발자 / 플랫폼 엔지니어",
            "keywords": ["python", "django", "fastapi", "api", "mysql", "spring", "java", "db", "postgresql", "node"],
            "gaps": ["대용량 트래픽 처리 경험", "NoSQL 데이터베이스 활용"],
            "next_actions": ["Redis 캐싱 시스템을 토이 프로젝트에 도입해 보세요."]
        },
        {
            "title": "DevOps / IT시스템관리 / 기술지원",
            "keywords": ["linux", "docker", "서버", "장애", "로그", "인프라", "kubernetes", "aws", "cloud", "배포"],
            "gaps": ["CI/CD 자동화 파이프라인 구축", "모니터링 얼럿 환경 설정"],
            "next_actions": ["GitHub Actions를 사용한 자동 배포 실습 프로젝트를 만들어 보세요."]
        },
        {
            "title": "정보보호관리 / 보안엔지니어",
            "keywords": ["보안", "취약점", "접근통제", "계정", "암호", "인증", "security", "해킹", "취약", "방화벽"],
            "gaps": ["취약점 진단 보고서 작성 경험", "보안 컴플라이언스(ISMS-P) 지식"],
            "next_actions": ["보안 취약점 조치 가이드를 정리한 블로그 포스팅이나 깃허브 위키를 작성해 보세요."]
        },
        {
            "title": "AI 서비스 백엔드 / LLM 애플리케이션 개발자",
            "keywords": ["llm", "rag", "langchain", "vector", "embedding", "gpt", "ai", "prompt", "인공지능"],
            "gaps": ["프롬프트 엔지니어링 최적화 검증", "Vector DB 기반 하이브리드 검색 구현"],
            "next_actions": ["LangChain을 활용하여 사내 RAG 검색 엔진 프로토타입을 만들어보세요."]
        },
        {
            "title": "데이터 분석 / ML 엔지니어",
            "keywords": ["데이터", "pandas", "모델", "예측", "ml", "dl", "머신러닝", "딥러닝", "tensorflow", "pytorch", "numpy"],
            "gaps": ["실시간 데이터 전처리 파이프라인 구축", "프로덕션 환경으로의 모델 서빙 경험"],
            "next_actions": ["Kaggle 오픈 데이터를 가공하여 예측 API 서버를 직접 구축하고 배포해 보세요."]
        }
    ]

    recommendations = []
    # If no experience is registered, return a default suggestion
    if not text.strip():
        return {
            "recommendations": [
                {
                    "title": "백엔드 개발자 (기본)",
                    "score": 50,
                    "reason": "등록된 경험 및 프로젝트 이력이 부족하여 일반적인 로드맵 기반 추천이 나갑니다.",
                    "gaps": ["기본 웹 개발 프로젝트", "데이터베이스 활용"],
                    "next_actions": ["경험이나 프로젝트를 최소 1개 이상 추가하여 정교한 피드백을 받아보세요."]
                }
            ]
        }

    for rule in rules:
        matched = [kw for kw in rule["keywords"] if kw in text]
        if matched:
            # Score based on how many keywords matched (capped at 95)
            score = min(50 + len(matched) * 10, 95)
            recommendations.append({
                "title": rule["title"],
                "score": score,
                "reason": f"이력서 및 프로젝트 키워드 분석 결과, 관련 분야 용어({', '.join(matched[:4])})가 확인되어 높은 연관성을 보입니다.",
                "gaps": rule["gaps"],
                "next_actions": rule["next_actions"]
            })
            
    # Sort recommendations by score desc
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    
    # Fallback if no matching keywords found
    if not recommendations:
        recommendations.append({
            "title": "IT 기술 부문 범용 소프트웨어 개발자",
            "score": 60,
            "reason": "프로필 내용이 입력되었으나 특정 특정 기술 트랙 키워드가 드러나지 않아 일반 개발 트랙을 추천합니다.",
            "gaps": ["특화 기술 스택 정의"],
            "next_actions": ["주력 프로그래밍 언어 및 프로젝트 산출물을 구체적으로 등록해 주세요."]
        })

    return {"recommendations": recommendations[:3]}

@router.post("/companies")
def recommend_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    text = extract_keywords_from_user(current_user, db)
    
    # Company type recommendation rules
    if not text.strip():
        return {
            "recommendations": [
                {
                    "title": "기술 중심 스타트업",
                    "score": 60,
                    "reason": "초기 이력 빌드를 진행하기 위해 빠른 릴리즈 사이클을 갖는 스타트업에 적합합니다.",
                    "gaps": ["독립적 기능 런칭 경험"],
                    "next_actions": ["단독으로 서비스 배포까지 완료한 풀스택 미니 토이프로젝트를 채워보세요."]
                }
            ]
        }

    recommendations = []
    
    # Check 1: Enterprise/Financial indicators
    enterprise_kws = ["java", "spring", "spring boot", "oracle", "jpa", "대기업", "금융", "보안", "접근통제", "isms"]
    matched_ent = [kw for kw in enterprise_kws if kw in text]
    if matched_ent:
        score = min(60 + len(matched_ent) * 8, 90)
        recommendations.append({
            "title": "대기업 및 전통적 금융 IT 부문",
            "score": score,
            "reason": "안정적인 프레임워크(Spring) 및 엔터프라이즈 환경 보안 관리 키워드가 이력에 어필될 수 있습니다.",
            "gaps": ["CS 기초 지식 및 알고리즘 코딩 테스트 준비", "안정성 중심의 아키텍처 설계 경험"],
            "next_actions": ["SQL 튜닝 지식을 블로그에 기록하고, 코딩테스트 기출을 매주 풀이하세요."]
        })

    # Check 2: Startup/Tech Unicorn indicators
    startup_kws = ["fastapi", "python", "node", "react", "docker", "kubernetes", "llm", "rag", "langchain", "aws"]
    matched_start = [kw for kw in startup_kws if kw in text]
    if matched_start:
        score = min(65 + len(matched_start) * 8, 93)
        recommendations.append({
            "title": "기술 주도형 스타트업 및 IT 유니콘 기업",
            "score": score,
            "reason": "최신 기술 스택 도입 속도가 빠르고, 클라우드 네이티브 및 AI 결합 모델 지식을 선호하는 기업 유형에 부합합니다.",
            "gaps": ["비즈니스 중심의 지표 개선 경험", "성능 모니터링 및 트러블 슈팅"],
            "next_actions": ["오픈소스 라이브러리 기여 활동이나 고도화된 아키텍처 최적화 사례를 이력서에 추가해 보세요."]
        })

    recommendations.sort(key=lambda x: x["score"], reverse=True)
    if not recommendations:
        recommendations.append({
            "title": "IT 솔루션 및 SI 기술 전문 기업",
            "score": 60,
            "reason": "특정 분야에 쏠림이 적고 범용 기술 스택을 보유한 점이 여러 기술 고객사를 지원하는 솔루션 기업에 어울립니다.",
            "gaps": ["실무 연관 서드파티 라이브러리 연동"],
            "next_actions": ["API 연동 실습 과제를 개인 이력에 보강해 보세요."]
        })

    return {"recommendations": recommendations[:2]}

@router.post("/next-roadmap")
def recommend_next_roadmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    text = extract_keywords_from_user(current_user, db)
    
    # Roadmap direction suggestions
    recommendations = []
    
    if "docker" not in text and "kubernetes" not in text:
        recommendations.append({
            "title": "컨테이너 기반 서비스 배포 학습 로드맵",
            "score": 85,
            "reason": "프로필에 가상화/컨테이너(Docker) 관련 기술 키워드가 보이지 않아, 최신 백엔드 표준 배포 지식 보완이 추천됩니다.",
            "gaps": ["Docker Image 빌드 및 최적화", "다중 컨테이너 Orchestration"],
            "next_actions": ["기존 프로젝트를 Dockerfile로 구성하여 AWS EC2 등에 컨테이너 단위 배포를 완수해 보세요."]
        })
        
    if "llm" in text or "rag" in text:
        recommendations.append({
            "title": "LLM 오케스트레이션 및 AI 서비스 결합 로드맵",
            "score": 90,
            "reason": "RAG 및 프롬프트 관련 지식이 감지되어, 단순 API 연동을 넘어 Vector DB 최적화 트랙으로 확장할 가치가 있습니다.",
            "gaps": ["임베딩 유사도 검색 개선 전략", "LangSmith를 활용한 LLM 추적 모니터링"],
            "next_actions": ["하이브리드 검색 파이프라인을 작성하고, RAG Retrieval 평가 프레임워크(Ragas)를 도입해 보세요."]
        })
        
    # Default fallback roadmap recommendation
    recommendations.append({
        "title": "대용량 트래픽 대비 분산 아키텍처 실천 로드맵",
        "score": 75,
        "reason": "웹 애플리케이션 핵심 역량을 강화하기 위한 데이터베이스 부하 분산 및 캐싱 기법 학습 단계가 유효합니다.",
        "gaps": ["Redis 캐시 무효화 전략 설계", "DB Read/Write Replication 분리 구현"],
        "next_actions": ["Locust와 같은 부하 테스트 도구로 현재 서버에 부하를 가하고 병목점을 캐시 도입으로 극복해 보세요."]
    })

    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return {"recommendations": recommendations[:2]}
