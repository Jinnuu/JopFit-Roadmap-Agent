from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.user import User
from backend.models.resume import ResumeDraft
from backend.schemas.user_data import ResumeDraftCreate, ResumeDraftUpdate, ResumeDraftOut
from backend.deps import get_current_user

router = APIRouter(prefix="/api/resume-drafts", tags=["resume-drafts"])

@router.post("", response_model=ResumeDraftOut, status_code=status.HTTP_201_CREATED)
def create_resume_draft(
    resume_in: ResumeDraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = ResumeDraft(
        user_id=current_user.id,
        title=resume_in.title,
        question=resume_in.question,
        answer=resume_in.answer,
        target_company=resume_in.target_company
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume

@router.get("", response_model=List[ResumeDraftOut])
def list_resume_drafts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ResumeDraft).filter(ResumeDraft.user_id == current_user.id).all()

@router.get("/{resume_id}", response_model=ResumeDraftOut)
def get_resume_draft(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = db.query(ResumeDraft).filter(
        ResumeDraft.id == resume_id,
        ResumeDraft.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume draft not found or access denied"
        )
    return resume

@router.put("/{resume_id}", response_model=ResumeDraftOut)
def update_resume_draft(
    resume_id: str,
    resume_in: ResumeDraftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = db.query(ResumeDraft).filter(
        ResumeDraft.id == resume_id,
        ResumeDraft.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume draft not found or access denied"
        )
    
    update_data = resume_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(resume, field, value)
    
    db.commit()
    db.refresh(resume)
    return resume

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume_draft(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = db.query(ResumeDraft).filter(
        ResumeDraft.id == resume_id,
        ResumeDraft.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume draft not found or access denied"
        )
    
    db.delete(resume)
    db.commit()
    return
