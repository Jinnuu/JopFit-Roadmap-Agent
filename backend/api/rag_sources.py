from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.user import User
from backend.models.rag import RAGSource
from backend.schemas.rag import RAGSourceCreate, RAGSourceOut
from backend.deps import get_current_user

router = APIRouter(prefix="/api/rag/sources", tags=["rag-sources"])

@router.post("", response_model=RAGSourceOut, status_code=status.HTTP_201_CREATED)
def create_rag_source(
    source_in: RAGSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not source_in.raw_text or not source_in.raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="raw_text cannot be empty"
        )
        
    source = RAGSource(
        user_id=current_user.id,
        source_type=source_in.source_type,
        title=source_in.title,
        url=source_in.url,
        raw_text=source_in.raw_text,
        company_name=source_in.company_name
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source

@router.get("", response_model=List[RAGSourceOut])
def list_rag_sources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(RAGSource).filter(RAGSource.user_id == current_user.id).all()

@router.get("/{source_id}", response_model=RAGSourceOut)
def get_rag_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(RAGSource).filter(
        RAGSource.id == source_id,
        RAGSource.user_id == current_user.id
    ).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RAG source not found or access denied"
        )
    return source

@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rag_source(
    source_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source = db.query(RAGSource).filter(
        RAGSource.id == source_id,
        RAGSource.user_id == current_user.id
    ).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RAG source not found or access denied"
        )
    db.delete(source)
    db.commit()
    return
