from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.services.recommendation_service import RecommendationService
from app.models.user import User

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


class SimilarityCheckRequest(BaseModel):
    title: str
    description: Optional[str] = ""


@router.get("/")
async def get_recommendations(
    top_k: int = Query(10, ge=1, le=50, description="Number of recommendations to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Get personalised FYP recommendations for the current user.

    Requires a completed profile. Calls the ML service to score all
    indexed projects against the student's skills, interests, and knowledge level.

    Returns a ranked list of projects with:
    - match_percentage (0-100)
    - match_reasons (human-readable explanations)
    - breakdown (per-dimension scores)
    - full project details
    """
    return await RecommendationService(db).get_recommendations(current_user, top_k=top_k)


@router.post("/similarity-check")
async def check_similarity(
    request: SimilarityCheckRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Check if a project idea is overused or too similar to existing projects.

    Send your idea title and description — the system will:
    - Find the most similar existing projects
    - Tell you how many similar projects already exist
    - Warn you if the idea is overused
    - Suggest adding a unique angle
    """
    return await RecommendationService(db).check_similarity(
        title=request.title,
        description=request.description or "",
    )
