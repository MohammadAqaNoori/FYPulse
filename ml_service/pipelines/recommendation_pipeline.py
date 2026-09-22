"""
Recommendation Pipeline
Scores and ranks projects against a student's profile.
Returns match score + breakdown explaining WHY a project matches.
"""
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
import numpy as np

from pipelines.embedding_pipeline import EmbeddingPipeline, get_pipeline
from utils.text_cleaner import normalize_technology
from utils.logger import logger


@dataclass
class StudentProfile:
    """Represents a student's preferences for matching."""
    user_id: int
    skills: List[str]
    interests: List[str]
    technologies: List[str]
    knowledge_level: str        # beginner | intermediate | advanced
    preferred_domains: List[str] = field(default_factory=list)
    preferred_project_type: Optional[str] = None


@dataclass
class ProjectCandidate:
    """A project to be scored against a profile."""
    key: str                    # project ID
    title: str
    combined_text: str
    technologies: List[str]
    domains: List[str]
    difficulty_level: str
    popularity_score: float


@dataclass
class MatchResult:
    """Match result for a single project against a profile."""
    key: str
    title: str
    match_score: float          # 0.0 - 1.0  overall
    breakdown: Dict[str, float] # per-dimension scores
    match_reasons: List[str]    # human-readable explanations


# ── Scoring weights ────────────────────────────────────────────────────────────
WEIGHTS = {
    "semantic":    0.35,    # embedding similarity (query vs project text)
    "skills":      0.25,    # skill/technology overlap
    "interests":   0.20,    # domain/interest overlap
    "difficulty":  0.15,    # difficulty suitability
    "popularity":  0.05,    # project popularity bonus
}

DIFFICULTY_RANK = {"beginner": 1, "intermediate": 2, "advanced": 3}


class RecommendationPipeline:
    """
    Scores projects against a student profile and returns ranked recommendations.
    """

    def __init__(self, pipeline: Optional[EmbeddingPipeline] = None):
        self.embedding = pipeline or get_pipeline()

    def recommend(
        self,
        profile: StudentProfile,
        candidates: List[ProjectCandidate],
        top_k: int = 10,
    ) -> List[MatchResult]:
        """
        Score all candidates against the profile and return top_k matches.
        """
        if not candidates:
            return []

        # Build profile query text for semantic matching
        profile_text = self._build_profile_text(profile)

        results = []
        for candidate in candidates:
            result = self._score(profile, profile_text, candidate)
            results.append(result)

        # Sort by overall match score descending
        results.sort(key=lambda r: r.match_score, reverse=True)
        return results[:top_k]

    def _score(
        self,
        profile: StudentProfile,
        profile_text: str,
        candidate: ProjectCandidate,
    ) -> MatchResult:

        breakdown = {}

        # 1. Semantic similarity via embeddings
        try:
            pv = self.embedding.transform_one(profile_text)
            cv = self.embedding.transform_one(candidate.combined_text)
            semantic = float(np.dot(pv, cv) / (np.linalg.norm(pv) * np.linalg.norm(cv) + 1e-9))
            breakdown["semantic"] = round(max(0.0, semantic), 4)
        except RuntimeError:
            breakdown["semantic"] = 0.0

        # 2. Skill / technology overlap (Jaccard similarity)
        profile_techs = set(normalize_technology(t) for t in profile.skills + profile.technologies)
        project_techs = set(normalize_technology(t) for t in candidate.technologies)
        if profile_techs or project_techs:
            intersection = profile_techs & project_techs
            union = profile_techs | project_techs
            breakdown["skills"] = round(len(intersection) / len(union), 4) if union else 0.0
        else:
            breakdown["skills"] = 0.0

        # 3. Interest / domain overlap
        profile_interests = set(i.lower() for i in profile.interests + profile.preferred_domains)
        project_domains = set(d.lower() for d in candidate.domains)
        if profile_interests or project_domains:
            intersection = profile_interests & project_domains
            union = profile_interests | project_domains
            breakdown["interests"] = round(len(intersection) / len(union), 4) if union else 0.0
        else:
            breakdown["interests"] = 0.0

        # 4. Difficulty suitability (1.0 if match, 0.5 if one level off, 0.0 if two levels off)
        student_rank = DIFFICULTY_RANK.get(profile.knowledge_level, 2)
        project_rank = DIFFICULTY_RANK.get(candidate.difficulty_level, 2)
        diff = abs(student_rank - project_rank)
        breakdown["difficulty"] = {0: 1.0, 1: 0.5, 2: 0.0}.get(diff, 0.0)

        # 5. Popularity bonus (normalized 0-1)
        breakdown["popularity"] = round(min(candidate.popularity_score, 1.0), 4)

        # Weighted sum
        overall = sum(WEIGHTS[k] * v for k, v in breakdown.items())
        overall = round(min(overall, 1.0), 4)

        reasons = self._build_reasons(profile, candidate, breakdown)

        return MatchResult(
            key=candidate.key,
            title=candidate.title,
            match_score=overall,
            breakdown=breakdown,
            match_reasons=reasons,
        )

    def _build_profile_text(self, profile: StudentProfile) -> str:
        """Convert profile into a text query for semantic embedding."""
        parts = profile.skills + profile.interests + profile.technologies + profile.preferred_domains
        return " ".join(parts)

    def _build_reasons(
        self,
        profile: StudentProfile,
        candidate: ProjectCandidate,
        breakdown: Dict[str, float],
    ) -> List[str]:
        """Generate human-readable match explanations."""
        reasons = []

        matched_techs = set(normalize_technology(t) for t in profile.skills + profile.technologies) \
                        & set(normalize_technology(t) for t in candidate.technologies)
        if matched_techs:
            reasons.append(f"Your skills match: {', '.join(list(matched_techs)[:3])}")

        matched_domains = set(i.lower() for i in profile.interests) \
                          & set(d.lower() for d in candidate.domains)
        if matched_domains:
            reasons.append(f"Matches your interest in: {', '.join(matched_domains)}")

        if breakdown["difficulty"] == 1.0:
            reasons.append(f"Difficulty ({candidate.difficulty_level}) is perfect for your level")
        elif breakdown["difficulty"] == 0.5:
            reasons.append(f"Difficulty is slightly different from your level — good stretch goal")

        if breakdown["semantic"] > 0.6:
            reasons.append("Strong semantic alignment with your profile")

        if candidate.popularity_score > 0.5:
            reasons.append("Well-regarded project in the community")

        return reasons or ["General match based on your profile"]


def build_candidates_from_projects(projects: list) -> List[ProjectCandidate]:
    """
    Convert a list of preprocessed project dicts or ProcessedProject objects
    into ProjectCandidate objects for the recommendation pipeline.
    """
    candidates = []
    for p in projects:
        if isinstance(p, dict):
            candidates.append(ProjectCandidate(
                key=p.get("source_url", str(id(p))),
                title=p.get("title", ""),
                combined_text=p.get("combined_text", ""),
                technologies=p.get("technologies", []),
                domains=p.get("domains", []),
                difficulty_level=p.get("difficulty_level", "intermediate"),
                popularity_score=p.get("popularity_score", 0.0),
            ))
        else:
            candidates.append(ProjectCandidate(
                key=p.source_url,
                title=p.title,
                combined_text=p.combined_text,
                technologies=p.technologies,
                domains=p.domains,
                difficulty_level=p.difficulty_level,
                popularity_score=p.popularity_score,
            ))
    return candidates
