# RAG (Retrieval-Augmented Generation) 가이드라인

RAG(검색 증강 생성)는 대규모 언어 모델(LLM)의 할루시네이션(환각 현상)을 방지하고 최신/사내 데이터를 기반으로 정확한 답변을 생성하도록 돕는 아키텍처 패턴입니다.

## RAG 파이프라인 흐름
1. **문서 로딩 및 전처리**: PDF, Markdown, HTML 등의 데이터를 읽어들이고, 텍스트를 적절한 크기(Chunk)로 분할합니다.
2. **임베딩(Embedding)**: 분할된 텍스트 청크를 다차원 벡터로 변환합니다.
3. **색인(Indexing)**: 생성된 벡터를 Vector DB(Chroma, Qdrant, FAISS 등)에 저장합니다.
4. **검색(Retrieval)**: 사용자의 질문이 입력되면, 동일한 임베딩 모델로 벡터 변환하여 유사도가 가장 높은 상위 K개의 청크를 Vector DB에서 조회합니다.
5. **생성(Generation)**: 조회된 문서 조각(Context)과 사용자의 원래 질문을 결합한 프롬프트를 구성하여 LLM에 전달하고 답변을 생성합니다.
