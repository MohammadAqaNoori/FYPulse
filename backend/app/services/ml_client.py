"""
ML Service HTTP Client
Handles all communication between the backend API and the ML microservice.
Uses httpx for async HTTP calls with proper timeouts and error handling.
"""
import httpx
from typing import Optional
from fastapi import HTTPException, status
from app.core.config import settings
from app.utils.logger import logger

# Timeouts: connect fast, allow longer for ML inference
_TIMEOUT = httpx.Timeout(connect=5.0, read=60.0, write=10.0, pool=5.0)


class MLServiceClient:

    def __init__(self):
        self.base_url = settings.ML_SERVICE_URL.rstrip("/")

    # ── Health ────────────────────────────────────────────────────────────────

    async def is_healthy(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                r = await client.get(f"{self.base_url}/health")
                return r.status_code == 200
        except Exception:
            return False

    # ── Recommendations ───────────────────────────────────────────────────────

    async def get_recommendations(
        self,
        user_id: int,
        skills: list[str],
        interests: list[str],
        technologies: list[str],
        knowledge_level: str,
        preferred_domains: list[str],
        top_k: int = 10,
    ) -> dict:
        """
        Ask the ML service to score all indexed projects against the student profile.
        Returns a list of match results with scores and reasons.
        """
        payload = {
            "user_id": user_id,
            "skills": skills,
            "interests": interests,
            "technologies": technologies,
            "knowledge_level": knowledge_level,
            "preferred_domains": preferred_domains,
            "top_k": top_k,
        }
        return await self._post("/ml/recommend", payload)

    # ── Similarity check ──────────────────────────────────────────────────────

    async def check_similarity(self, title: str, description: str) -> dict:
        """
        Check how similar a project idea is to existing indexed projects.
        Returns a similarity report with overused-idea detection.
        """
        payload = {"title": title, "description": description}
        return await self._post("/ml/similarity", payload)

    # ── Idea generator ────────────────────────────────────────────────────────

    async def generate_ideas(
        self,
        skills: list[str],
        interests: list[str],
        knowledge_level: str,
        count: int = 5,
    ) -> dict:
        """Ask the ML service to generate novel FYP ideas for this student."""
        payload = {
            "skills": skills,
            "interests": interests,
            "knowledge_level": knowledge_level,
            "count": count,
        }
        return await self._post("/ml/generate", payload)

    # ── Scraper trigger ───────────────────────────────────────────────────────

    async def trigger_scrape(self, source: str = "github", query: str = "final year project") -> dict:
        payload = {"source": source, "query": query, "max_results": 50}
        return await self._post("/ml/scrape", payload)

    # ── Internal ──────────────────────────────────────────────────────────────

    async def _post(self, path: str, payload: dict) -> dict:
        url = f"{self.base_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.ConnectError:
            logger.error(f"ML service unreachable at {url}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ML service is not running. Please start the ML service on port 8001.",
            )
        except httpx.TimeoutException:
            logger.error(f"ML service timeout at {url}")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="ML service timed out. Try again in a moment.",
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"ML service returned {e.response.status_code} for {url}")
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"ML service error: {e.response.text}",
            )


# module-level singleton
ml_client = MLServiceClient()
