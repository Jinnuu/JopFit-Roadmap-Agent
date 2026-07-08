# 6주 프로젝트 템플릿: RAG 서비스 추가 구현

백엔드 개발 분야 신입 구직자를 위한 6주 완성 RAG(Retrieval-Augmented Generation) 기능 추가 프로젝트 가이드라인입니다.

## 주차별 마일스톤
- **1주차**: 기존 프로젝트의 아키텍처 및 데이터 모델 파악, RAG 구현 시나리오(예: 식단 정보 검색, 사내 매뉴얼 Q&A 등) 정의.
- **2주차**: 데이터 전처리 파이프라인 설계. PDF/Markdown 등 대상 문서 로딩 및 TextSplitter를 사용한 Chunking 최적화.
- **3주차**: 로컬 또는 클라우드 Vector DB 설정(Chroma, FAISS 등), Embedding 모델 연동 및 데이터 색인화 자동화 구현.
- **4주차**: Retriever 구축 및 LLM API 연동. LangChain 또는 LlamaIndex를 도입하여 Retrieval QA API 개발.
- **5주차**: 복잡한 비즈니스 로직 제어를 위한 LangGraph 도입 및 워크플로우 제어(예: 검색 결과 유효성 판단 후 LLM 전달).
- **6주차**: 사용자 질의/답변 로그 데이터 모델링 및 저장 로직 구현. Docker Compose를 활용해 전체 시스템을 단일 명령어로 배포 가능하게 구성. README 및 아키텍처 문서 최종 정리.
