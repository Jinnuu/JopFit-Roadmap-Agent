from datetime import timedelta, date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.models.user import User
from backend.models.analysis import AnalysisHistory
from backend.models.roadmap import Roadmap, RoadmapTask
from backend.models.notification import Notification
from backend.schemas.roadmap import RoadmapCreateRequest, RoadmapOut, RoadmapDetailOut, RoadmapTaskUpdate, RoadmapTaskOut
from backend.deps import get_current_user

router = APIRouter(prefix="/api/roadmaps", tags=["roadmaps"])

@router.post("/from-analysis/{analysis_id}", response_model=RoadmapOut, status_code=status.HTTP_201_CREATED)
def create_roadmap_from_analysis(
    analysis_id: str,
    req: RoadmapCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch analysis history
    history = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == current_user.id
    ).first()
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis history not found or access denied"
        )
    
    # 2. Extract roadmap data from result_json
    result = history.result_json
    roadmap_data = result.get("roadmap", {})
    if not roadmap_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No roadmap plan found in the analysis result"
        )
    
    title = roadmap_data.get("title", f"{history.company_name or '미정'} 맞춤 보완 로드맵")
    weekly_plan = roadmap_data.get("weekly_plan", [])
    duration_weeks = len(weekly_plan) if weekly_plan else 4

    # 3. Create Roadmap Master
    roadmap = Roadmap(
        user_id=current_user.id,
        analysis_id=history.id,
        target_company=history.company_name,
        target_role=history.position,
        title=title,
        duration_weeks=duration_weeks,
        start_date=req.start_date,
        status="active"
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    # 4. Create Roadmap Tasks
    for plan in weekly_plan:
        week = plan.get("week", 1)
        goal = plan.get("goal", "")
        detail = plan.get("detail", "")
        
        # due_date = start_date + week * 7 - 1 days
        due_date = req.start_date + timedelta(days=(week * 7) - 1)
        
        task = RoadmapTask(
            roadmap_id=roadmap.id,
            week=week,
            title=goal,
            detail=detail,
            due_date=due_date,
            status="todo"
        )
        db.add(task)
    
    db.commit()

    # 5. Create Notification
    notif = Notification(
        user_id=current_user.id,
        type="roadmap_created",
        title="새 로드맵이 생성되었습니다",
        message=f"'{title}' 로드맵이 성공적으로 활성화되었습니다. 주차별 과제를 수행해보세요!",
        related_roadmap_id=roadmap.id,
        is_read=False
    )
    db.add(notif)
    db.commit()

    return roadmap

@router.get("", response_model=List[RoadmapOut])
def list_roadmaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Roadmap).filter(Roadmap.user_id == current_user.id).all()

@router.get("/{roadmap_id}", response_model=RoadmapDetailOut)
def get_roadmap_detail(
    roadmap_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id
    ).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found or access denied"
        )
    return roadmap

@router.patch("/{roadmap_id}/tasks/{task_id}", response_model=RoadmapTaskOut)
def update_roadmap_task_status(
    roadmap_id: str,
    task_id: str,
    task_in: RoadmapTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify roadmap ownership
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id
    ).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found or access denied"
        )
    
    # Fetch task
    task = db.query(RoadmapTask).filter(
        RoadmapTask.id == task_id,
        RoadmapTask.roadmap_id == roadmap_id
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found in this roadmap"
        )
    
    old_status = task.status
    new_status = task_in.status
    
    task.status = new_status
    db.commit()
    db.refresh(task)

    # Trigger notification on completion
    if new_status == "done" and old_status != "done":
        notif = Notification(
            user_id=current_user.id,
            type="task_completed",
            title="과제가 완료되었습니다",
            message=f"'{roadmap.title}'의 {task.week}주차 과제 '{task.title}'을(를) 완료했습니다!",
            related_roadmap_id=roadmap.id,
            related_task_id=task.id,
            is_read=False
        )
        db.add(notif)
        db.commit()

    return task

@router.delete("/{roadmap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_roadmap(
    roadmap_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.id == roadmap_id,
        Roadmap.user_id == current_user.id
    ).first()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Roadmap not found or access denied"
        )
    db.delete(roadmap)
    db.commit()
    return
