"""
Recommendation Pipeline — improved scoring v2
Combines semantic similarity, skill overlap, domain overlap, difficulty fit,
and popularity with smarter normalization and partial-match bonuses.
"""
from typing import List, Dict, Optional
from dataclasses import dataclass, field
import numpy as np

from pipelines.embedding_pipeline import EmbeddingPipeline, get_pipeline
from utils.text_cleaner import normalize_technology
from utils.logger import logger


@dataclass
class StudentProfile:
    user_id: int
    skills: List[str]
    interests: List[str]
    technologies: List[str]
    knowledge_level: str
    preferred_domains: List[str] = field(default_factory=list)
    preferred_project_type: Optional[str] = None


@dataclass
class ProjectCandidate:
    key: str
    title: str
    combined_text: str
    technologies: List[str]
    domains: List[str]
    difficulty_level: str
    popularity_score: float


@dataclass
class MatchResult:
    key: str
    title: str
    match_score: float
    breakdown: Dict[str, float]
    match_reasons: List[str]


# ── Scoring weights (must sum to 1.0) ─────────────────────────────────────────
WEIGHTS = {
    "semantic":   0.40,   # TF-IDF cosine similarity — most important signal
    "skills":     0.28,   # tech/skill overlap (improved partial matching)
    "interests":  0.18,   # domain/interest overlap
    "difficulty": 0.09,   # level suitability
    "popularity": 0.05,   # stars bonus
}

DIFFICULTY_RANK = {"beginner": 1, "intermediate": 2, "advanced": 3}

# Technology synonym groups — expand matching beyond exact strings
TECH_SYNONYMS: Dict[str, set] = {
    "python":       {"py", "python3", "python2"},
    "javascript":   {"js", "node", "nodejs", "typescript", "ts"},
    "react":        {"reactjs", "react.js", "nextjs", "next"},
    "machine-learning": {"ml", "sklearn", "scikit-learn", "scikit"},
    "deep-learning":    {"dl", "neural-network", "nn", "tensorflow", "keras", "pytorch", "torch"},
    "ai":           {"artificial-intelligence", "machine-learning", "deep-learning"},
    "backend":      {"django", "flask", "fastapi", "nodejs", "express", "spring", "laravel"},
    "full-stack":   {"fullstack", "full stack", "mern", "mean", "django", "react"},
    "sql":          {"mysql", "postgresql", "sqlite", "postgres", "database"},
    "computer-vision": {"cv", "opencv", "vision", "yolo", "cnn"},
    "nlp":          {"natural-language-processing", "bert", "gpt", "transformers", "text-mining"},
}


def _expand_terms(terms: List[str]) -> set:
    """Expand a list of tech/skill terms using synonym groups."""
    expanded = set()
    for t in terms:
        t_norm = normalize_technology(t)
        expanded.add(t_norm)
        # Add synonyms
        for canonical, synonyms in TECH_SYNONYMS.items():
            if t_norm == canonical or t_norm in synonyms:
                expanded.add(canonical)
                expanded.update(synonyms)
    return expanded


def _soft_overlap(set_a: set, set_b: set) -> float:
    """
    Improved overlap score:
    - Uses Dice coefficient instead of Jaccard (less penalised for large sets)
    - Returns 0–1
    """
    if not set_a and not set_b:
        return 0.0
    intersection = set_a & set_b
    if not intersection:
        return 0.0
    dice = 2 * len(intersection) / (len(set_a) + len(set_b))
    return round(dice, 4)


class RecommendationPipeline:

    def __init__(self, pipeline: Optional[EmbeddingPipeline] = None):
        self.embedding = pipeline or get_pipeline()

    def recommend(
        self,
        profile: StudentProfile,
        candidates: List[ProjectCandidate],
        top_k: int = 10,
    ) -> List[MatchResult]:
        if not candidates:
            return []

        profile_text = self._build_profile_text(profile)

        # Pre-compute profile vector once
        try:
            profile_vec = self.embedding.transform_one(profile_text)
        except RuntimeError:
            profile_vec = None

        results = []
        for candidate in candidates:
            result = self._score(profile, profile_vec, candidate)
            results.append(result)

        results.sort(key=lambda r: r.match_score, reverse=True)
        return results[:top_k]

    def _score(
        self,
        profile: StudentProfile,
        profile_vec: Optional[np.ndarray],
        candidate: ProjectCandidate,
    ) -> MatchResult:
        breakdown: Dict[str, float] = {}

        # ── 1. Semantic similarity ─────────────────────────────────────────────
        if profile_vec is not None:
            try:
                cv = self.embedding.transform_one(candidate.combined_text)
                norm = np.linalg.norm(profile_vec) * np.linalg.norm(cv) + 1e-9
                semantic = float(np.dot(profile_vec, cv) / norm)
                # Rescale: cosine in TF-IDF space rarely exceeds 0.4 for cross-domain
                # Stretch it to 0–1 range using soft clipping
                semantic = min(max(semantic, 0.0), 1.0)
                # Boost: rescale from [0, 0.5] → [0, 1] to spread scores more
                semantic = min(semantic * 2.0, 1.0)
                breakdown["semantic"] = round(semantic, 4)
            except Exception:
                breakdown["semantic"] = 0.0
        else:
            breakdown["semantic"] = 0.0

        # ── 2. Skill / technology overlap with synonym expansion ──────────────
        profile_techs = _expand_terms(profile.skills + profile.technologies)
        project_techs = _expand_terms(candidate.technologies)
        breakdown["skills"] = _soft_overlap(profile_techs, project_techs)

        # ── 3. Interest / domain overlap ──────────────────────────────────────
        profile_interests = _expand_terms(profile.interests + profile.preferred_domains)
        project_domains   = _expand_terms(candidate.domains)
        breakdown["interests"] = _soft_overlap(profile_interests, project_domains)

        # Also check if any profile interest keyword appears in title/combined_text
        title_lower = candidate.combined_text.lower()
        for interest in profile.interests:
            if interest.lower() in title_lower:
                breakdown["interests"] = min(breakdown["interests"] + 0.15, 1.0)
                break

        # ── 4. Difficulty suitability ─────────────────────────────────────────
        student_rank = DIFFICULTY_RANK.get(profile.knowledge_level, 2)
        project_rank = DIFFICULTY_RANK.get(candidate.difficulty_level, 2)
        diff = abs(student_rank - project_rank)
        breakdown["difficulty"] = {0: 1.0, 1: 0.6, 2: 0.2}.get(diff, 0.2)

        # ── 5. Popularity bonus ────────────────────────────────────────────────
        breakdown["popularity"] = round(min(candidate.popularity_score, 1.0), 4)

        # ── Weighted sum ───────────────────────────────────────────────────────
        overall = sum(WEIGHTS[k] * v for k, v in breakdown.items())

        # Soft floor: even a partial semantic match should give at least 30%
        # to avoid discouraging valid but different-worded matches
        if breakdown["semantic"] > 0.1 or breakdown["skills"] > 0.0:
            overall = max(overall, 0.30)

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
        """
        Build a rich profile query text.
        Repeat high-importance terms to give them more TF-IDF weight.
        """
        parts = (
            profile.skills * 3 +          # skills are most important
            profile.technologies * 2 +
            profile.interests * 2 +
            profile.preferred_domains +
            [profile.knowledge_level]
        )
        return " ".join(parts)

    def _build_reasons(
        self,
        profile: StudentProfile,
        candidate: ProjectCandidate,
        breakdown: Dict[str, float],
    ) -> List[str]:
        reasons = []

        # Tech matches (show the actual matched terms)
        matched = _expand_terms(profile.skills + profile.technologies) & _expand_terms(candidate.technologies)
        # Only show canonical terms that appear in original lists
        display = [
            t for t in (profile.skills + profile.technologies)
            if normalize_technology(t) in matched
        ][:3]
        if display:
            reasons.append(f"Your skills match: {', '.join(display)}")

        # Domain matches
        matched_domains = (
            set(i.lower() for i in profile.interests) &
            set(d.lower() for d in candidate.domains)
        )
        if matched_domains:
            reasons.append(f"Matches your interest in: {', '.join(matched_domains)}")

        # Difficulty
        if breakdown["difficulty"] >= 1.0:
            reasons.append(f"Difficulty ({candidate.difficulty_level}) fits your level perfectly")
        elif breakdown["difficulty"] >= 0.6:
            reasons.append(f"Good stretch project — slightly above your current level")

        # Semantic
        if breakdown["semantic"] > 0.5:
            reasons.append("Strong relevance to your skills and interests")
        elif breakdown["semantic"] > 0.25:
            reasons.append("Relevant to your profile")

        # Popularity
        if candidate.popularity_score > 0.4:
            reasons.append("Highly regarded project in the community")

        return reasons or ["Relevant based on your overall profile"]


def build_candidates_from_projects(projects: list) -> List[ProjectCandidate]:
    candidates = []
    for p in projects:
        if isinstance(p, dict):
            candidates.append(ProjectCandidate(
                key=p.get("source_url", str(id(p))),
                title=p.get("title", ""),
                combined_text=p.get("combined_text", p.get("title", "")),
                technologies=p.get("technologies", []),
                domains=p.get("domains", []),
                difficulty_level=p.get("difficulty_level", "intermediate"),
                popularity_score=p.get("popularity_score", 0.0),
            ))
        else:
            candidates.append(ProjectCandidate(
                key=p.source_url,
                title=p.title,
                combined_text=getattr(p, "combined_text", p.title),
                technologies=p.technologies,
                domains=p.domains,
                difficulty_level=p.difficulty_level,
                popularity_score=p.popularity_score,
            ))
    return candidates
