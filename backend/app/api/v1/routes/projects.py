from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.services.project_service import ProjectService
from app.schemas.project import ProjectResponse, ProjectSearchParams
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/")
def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """List all projects (paginated, sorted by popularity)."""
    return ProjectService(db).get_all(page=page, page_size=page_size)


@router.get("/search")
def search_projects(
    query: Optional[str] = Query(None),
    technologies: Optional[List[str]] = Query(None),
    domains: Optional[List[str]] = Query(None),
    difficulty_level: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Search and filter projects."""
    params = ProjectSearchParams(
        query=query,
        technologies=technologies,
        domains=domains,
        difficulty_level=difficulty_level,
        page=page,
        page_size=page_size,
    )
    return ProjectService(db).search_projects(params)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    """Get a single project by ID."""
    return ProjectService(db).get_project(project_id)
