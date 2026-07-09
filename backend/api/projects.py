from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.user import User
from backend.models.project import Project
from backend.schemas.user_data import ProjectCreate, ProjectUpdate, ProjectOut
from backend.deps import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    proj_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proj = Project(
        user_id=current_user.id,
        title=proj_in.title,
        role=proj_in.role,
        tech_stack=proj_in.tech_stack,
        description=proj_in.description,
        contribution=proj_in.contribution,
        outcomes=proj_in.outcomes,
        project_url=proj_in.project_url
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

@router.get("", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Project).filter(Project.user_id == current_user.id).all()

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proj = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
    return proj

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str,
    proj_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proj = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
    
    update_data = proj_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(proj, field, value)
    
    db.commit()
    db.refresh(proj)
    return proj

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proj = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not proj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied"
        )
    
    db.delete(proj)
    db.commit()
    return
