from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
from app.schemas.project import ProjectResponse


class RecommendationResponse(BaseModel):
    id: int
    match_score: float
    match_breakdown: Optional[Dict[str, float]]
    project: ProjectResponse
    created_at: datetime

    model_config = {"from_attributes": True}


class RecommendationListResponse(BaseModel):
    total: int
    recommendations: list[RecommendationResponse]
