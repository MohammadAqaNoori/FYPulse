from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    source_url: Optional[str]
    source_type: Optional[str]
    technologies: List[str]
    domains: List[str]
    difficulty_level: Optional[str]
    popularity_score: float
    similarity_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectSearchParams(BaseModel):
    query: Optional[str] = None
    technologies: Optional[List[str]] = None
    domains: Optional[List[str]] = None
    difficulty_level: Optional[str] = None
    page: int = 1
    page_size: int = 20
