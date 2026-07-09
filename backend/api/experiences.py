from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.user import User
from backend.models.experience import Experience
from backend.schemas.user_data import ExperienceCreate, ExperienceUpdate, ExperienceOut
from backend.deps import get_current_user

router = APIRouter(prefix="/api/experiences", tags=["experiences"])

@router.post("", response_model=ExperienceOut, status_code=status.HTTP_201_CREATED)
def create_experience(
    exp_in: ExperienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = Experience(
        user_id=current_user.id,
        title=exp_in.title,
        category=exp_in.category,
        start_date=exp_in.start_date,
        end_date=exp_in.end_date,
        description=exp_in.description,
        skills_gained=exp_in.skills_gained
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

@router.get("", response_model=List[ExperienceOut])
def list_experiences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Experience).filter(Experience.user_id == current_user.id).all()

@router.get("/{experience_id}", response_model=ExperienceOut)
def get_experience(
    experience_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.user_id == current_user.id
    ).first()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found or access denied"
        )
    return exp

@router.put("/{experience_id}", response_model=ExperienceOut)
def update_experience(
    experience_id: str,
    exp_in: ExperienceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.user_id == current_user.id
    ).first()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found or access denied"
        )
    
    update_data = exp_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(exp, field, value)
    
    db.commit()
    db.refresh(exp)
    return exp

@router.delete("/{experience_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    experience_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Experience).filter(
        Experience.id == experience_id,
        Experience.user_id == current_user.id
    ).first()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience not found or access denied"
        )
    
    db.delete(exp)
    db.commit()
    return
