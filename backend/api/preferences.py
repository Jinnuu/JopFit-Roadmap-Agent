from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.user import User
from backend.models.preference import PreferredCompany, PreferredRole, SavedJobPosting
from backend.schemas.user_data import (
    PreferredCompanyCreate, PreferredCompanyOut,
    PreferredRoleCreate, PreferredRoleOut,
    SavedJobPostingCreate, SavedJobPostingOut
)
from backend.deps import get_current_user

router = APIRouter(prefix="/api/preferences", tags=["preferences"])

# Preferred Companies
@router.post("/companies", response_model=PreferredCompanyOut, status_code=status.HTTP_201_CREATED)
def create_preferred_company(
    comp_in: PreferredCompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comp = PreferredCompany(
        user_id=current_user.id,
        company_name=comp_in.company_name,
        industry=comp_in.industry,
        memo=comp_in.memo
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp

@router.get("/companies", response_model=List[PreferredCompanyOut])
def list_preferred_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(PreferredCompany).filter(PreferredCompany.user_id == current_user.id).all()

@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_preferred_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comp = db.query(PreferredCompany).filter(
        PreferredCompany.id == company_id,
        PreferredCompany.user_id == current_user.id
    ).first()
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferred company not found or access denied"
        )
    db.delete(comp)
    db.commit()
    return

# Preferred Roles
@router.post("/roles", response_model=PreferredRoleOut, status_code=status.HTTP_201_CREATED)
def create_preferred_role(
    role_in: PreferredRoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = PreferredRole(
        user_id=current_user.id,
        role_name=role_in.role_name,
        priority=role_in.priority
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.get("/roles", response_model=List[PreferredRoleOut])
def list_preferred_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(PreferredRole).filter(PreferredRole.user_id == current_user.id).order_by(PreferredRole.priority).all()

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_preferred_role(
    role_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = db.query(PreferredRole).filter(
        PreferredRole.id == role_id,
        PreferredRole.user_id == current_user.id
    ).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferred role not found or access denied"
        )
    db.delete(role)
    db.commit()
    return

# Saved Job Postings
@router.post("/job-postings", response_model=SavedJobPostingOut, status_code=status.HTTP_201_CREATED)
def create_saved_job_posting(
    posting_in: SavedJobPostingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    posting = SavedJobPosting(
        user_id=current_user.id,
        company_name=posting_in.company_name,
        position_title=posting_in.position_title,
        job_url=posting_in.job_url,
        raw_text=posting_in.raw_text,
        deadline=posting_in.deadline
    )
    db.add(posting)
    db.commit()
    db.refresh(posting)
    return posting

@router.get("/job-postings", response_model=List[SavedJobPostingOut])
def list_saved_job_postings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(SavedJobPosting).filter(SavedJobPosting.user_id == current_user.id).all()

@router.get("/job-postings/{posting_id}", response_model=SavedJobPostingOut)
def get_saved_job_posting(
    posting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    posting = db.query(SavedJobPosting).filter(
        SavedJobPosting.id == posting_id,
        SavedJobPosting.user_id == current_user.id
    ).first()
    if not posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found or access denied"
        )
    return posting

@router.delete("/job-postings/{posting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_job_posting(
    posting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    posting = db.query(SavedJobPosting).filter(
        SavedJobPosting.id == posting_id,
        SavedJobPosting.user_id == current_user.id
    ).first()
    if not posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found or access denied"
        )
    db.delete(posting)
    db.commit()
    return
