from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.services.ml_client import ml_client
from app.models.user import User

router = APIRouter(prefix="/generator", tags=["Idea Generator"])


class GenerateIdeasRequest(BaseModel):
    count: int = 5
    # Optional overrides — if not provided, profile data is used
    extra_skills: Optional[List[str]] = None
    extra_interests: Optional[List[str]] = None


@router.post("/")
async def generate_ideas(
    request: GenerateIdeasRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Generate novel FYP ideas tailored to the current user's profile.

    Uses the ML service idea generator which:
    - Analyzes patterns in all indexed projects
    - Finds underrepresented domain + technology combinations
    - Creates unique project concepts the student can realistically build

    Each idea includes:
    - title, description, suggested tech stack
    - novelty_score (how unique the idea is)
    - rationale (why this idea was generated for you)
    """
    if not current_user.profile:
        return {
            "message": "Please complete your profile first to get personalised ideas.",
            "ideas": [],
        }

    profile = current_user.profile
    skills = (profile.skills or []) + (request.extra_skills or [])
    interests = (profile.interests or []) + (request.extra_interests or [])

    result = await ml_client.generate_ideas(
        skills=skills,
        interests=interests,
        knowledge_level=profile.knowledge_level or "intermediate",
        count=min(request.count, 10),
    )

    return {
        "user_id": current_user.id,
        "count": len(result.get("ideas", [])),
        "ideas": result.get("ideas", []),
    }


@router.post("/scrape")
async def trigger_scrape(
    source: str = Query("github", description="Source to scrape: github | university | all"),
    query: str = Query("final year project", description="Search query"),
    current_user: User = Depends(get_current_active_user),
):
    """
    Trigger a background data collection run.
    Fetches FYP projects from the specified source and indexes them.
    """
    result = await ml_client.trigger_scrape(source=source, query=query)
    return result
