from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models.user import User
from app.models.project import Project
from app.models.recommendation import Recommendation
from app.services.ml_client import ml_client
from app.utils.logger import logger


class RecommendationService:

    def __init__(self, db: Session):
        self.db = db

    async def get_recommendations(self, user: User, top_k: int = 10) -> dict:
        """
        Get personalised recommendations for a user.
        Flow:
          1. Check user has a profile
          2. Call ML service with profile data
          3. Enrich results with full project data from DB
          4. Cache results in recommendations table
          5. Return enriched list
        """
        if not user.profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please complete your profile before getting recommendations.",
            )

        profile = user.profile

        # Call ML service
        ml_result = await ml_client.get_recommendations(
            user_id=user.id,
            skills=profile.skills or [],
            interests=profile.interests or [],
            technologies=profile.technologies or [],
            knowledge_level=profile.knowledge_level or "intermediate",
            preferred_domains=profile.interests or [],
            top_k=top_k,
        )

        recommendations = ml_result.get("recommendations", [])

        # Enrich with DB project data where possible
        enriched = []
        for rec in recommendations:
            source_url = rec.get("key", "")
            project = self.db.query(Project).filter(Project.source_url == source_url).first()

            enriched.append({
                "match_score": rec.get("match_score", 0.0),
                "match_percentage": int(rec.get("match_score", 0.0) * 100),
                "match_reasons": rec.get("match_reasons", []),
                "breakdown": rec.get("breakdown", {}),
                "project": {
                    "id": project.id if project else None,
                    "title": rec.get("title", ""),
                    "description": project.description if project else None,
                    "source_url": source_url,
                    "technologies": project.technologies if project else [],
                    "domains": project.domains if project else [],
                    "difficulty_level": rec.get("difficulty_level"),
                    "popularity_score": project.popularity_score if project else 0.0,
                },
            })

            # Persist recommendation to DB if project exists
            if project:
                self._save_recommendation(user.id, project.id, rec)

        return {
            "total": len(enriched),
            "user_id": user.id,
            "recommendations": enriched,
        }

    async def check_similarity(self, title: str, description: str) -> dict:
        """Check if a project idea is overused / similar to existing projects."""
        return await ml_client.check_similarity(title, description)

    def _save_recommendation(self, user_id: int, project_id: int, rec: dict) -> None:
        """Persist/update a recommendation in the DB."""
        try:
            existing = (
                self.db.query(Recommendation)
                .filter(Recommendation.user_id == user_id, Recommendation.project_id == project_id)
                .first()
            )
            if existing:
                existing.match_score = rec.get("match_score", 0.0)
                existing.match_breakdown = rec.get("breakdown", {})
            else:
                self.db.add(Recommendation(
                    user_id=user_id,
                    project_id=project_id,
                    match_score=rec.get("match_score", 0.0),
                    match_breakdown=rec.get("breakdown", {}),
                ))
            self.db.commit()
        except Exception as e:
            logger.error(f"Failed to save recommendation: {e}")
            self.db.rollback()
