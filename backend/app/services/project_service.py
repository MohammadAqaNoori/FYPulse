from sqlalchemy.orm import Session
from typing import Optional, List
from app.repositories.project_repo import ProjectRepository
from app.schemas.project import ProjectResponse, ProjectSearchParams


class ProjectService:
    def __init__(self, db: Session):
        self.repo = ProjectRepository(db)

    def search_projects(self, params: ProjectSearchParams) -> dict:
        projects, total = self.repo.search(
            query=params.query,
            technologies=params.technologies,
            domains=params.domains,
            difficulty_level=params.difficulty_level,
            page=params.page,
            page_size=params.page_size,
        )
        return {
            "total": total,
            "page": params.page,
            "page_size": params.page_size,
            "projects": [ProjectResponse.model_validate(p) for p in projects],
        }

    def get_project(self, project_id: int) -> ProjectResponse:
        from fastapi import HTTPException, status
        project = self.repo.get_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project with id {project_id} not found",
            )
        return ProjectResponse.model_validate(project)

    def get_all(self, page: int = 1, page_size: int = 20) -> dict:
        projects, total = self.repo.get_all_paginated(page, page_size)
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "projects": [ProjectResponse.model_validate(p) for p in projects],
        }
