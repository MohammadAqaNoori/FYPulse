from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.models.project import Project


class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, project_id: int) -> Optional[Project]:
        return self.db.query(Project).filter(Project.id == project_id).first()

    def search(
        self,
        query: Optional[str] = None,
        technologies: Optional[List[str]] = None,
        domains: Optional[List[str]] = None,
        difficulty_level: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[List[Project], int]:
        q = self.db.query(Project)

        if query:
            q = q.filter(
                or_(
                    Project.title.ilike(f"%{query}%"),
                    Project.description.ilike(f"%{query}%"),
                )
            )
        if technologies:
            q = q.filter(Project.technologies.overlap(technologies))
        if domains:
            q = q.filter(Project.domains.overlap(domains))
        if difficulty_level:
            q = q.filter(Project.difficulty_level == difficulty_level)

        total = q.count()
        projects = q.offset((page - 1) * page_size).limit(page_size).all()
        return projects, total

    def get_all_paginated(self, page: int = 1, page_size: int = 20) -> tuple[List[Project], int]:
        total = self.db.query(Project).count()
        projects = (
            self.db.query(Project)
            .order_by(Project.popularity_score.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return projects, total
