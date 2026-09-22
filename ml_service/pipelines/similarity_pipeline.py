"""
Similarity Pipeline
Detects how similar a given project/idea is to existing ones in the database.
This powers the "overused idea" detection feature — a core FYPulse differentiator.
"""
from typing import List, Tuple, Optional
from dataclasses import dataclass
import numpy as np

from pipelines.embedding_pipeline import EmbeddingPipeline, get_pipeline
from utils.logger import logger


@dataclass
class SimilarityResult:
    """Result of a similarity check against a single project."""
    key: str                    # project ID or URL
    title: str
    similarity_score: float     # 0.0 - 1.0
    is_duplicate: bool          # score >= duplicate_threshold


@dataclass
class SimilarityReport:
    """Full report for a query project."""
    query_title: str
    total_similar: int          # count above threshold
    is_overused: bool           # True if many similar projects exist
    overused_message: str       # human-readable warning
    top_matches: List[SimilarityResult]
    average_similarity: float


# Thresholds
DUPLICATE_THRESHOLD = 0.85      # above this → near-duplicate
SIMILAR_THRESHOLD = 0.50        # above this → similar / related
OVERUSED_COUNT = 5              # if >= this many similar, idea is "overused"


class SimilarityPipeline:
    """
    Checks a project text against all indexed projects and returns a similarity report.
    """

    def __init__(self, pipeline: Optional[EmbeddingPipeline] = None):
        self.embedding = pipeline or get_pipeline()

    def check_similarity(
        self,
        query_text: str,
        query_title: str,
        project_titles: dict,       # {key: title} mapping for all indexed projects
        top_k: int = 10,
    ) -> SimilarityReport:
        """
        Compare query_text against all indexed projects.

        Args:
            query_text: combined text of the project to check
            query_title: display title of the query project
            project_titles: dict mapping project keys to their titles
            top_k: how many top matches to return

        Returns:
            SimilarityReport
        """
        try:
            query_vec = self.embedding.transform_one(query_text)
            matrix, keys = self.embedding.get_matrix()
        except RuntimeError as e:
            logger.error(f"Similarity check failed: {e}")
            return SimilarityReport(
                query_title=query_title,
                total_similar=0,
                is_overused=False,
                overused_message="Embedding model not ready yet.",
                top_matches=[],
                average_similarity=0.0,
            )

        # Compute cosine similarities against entire matrix at once
        scores = matrix @ query_vec  # shape: (n_projects,)

        # Get top_k indices
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        similar_count = 0

        for idx in top_indices:
            score = float(scores[idx])
            if score < 0.1:
                break
            key = keys[idx]
            title = project_titles.get(key, key)
            is_dup = score >= DUPLICATE_THRESHOLD
            if score >= SIMILAR_THRESHOLD:
                similar_count += 1
            results.append(SimilarityResult(
                key=key,
                title=title,
                similarity_score=round(score, 4),
                is_duplicate=is_dup,
            ))

        avg_sim = float(np.mean([r.similarity_score for r in results])) if results else 0.0
        is_overused = similar_count >= OVERUSED_COUNT

        overused_message = self._build_overused_message(
            query_title, similar_count, is_overused, results
        )

        return SimilarityReport(
            query_title=query_title,
            total_similar=similar_count,
            is_overused=is_overused,
            overused_message=overused_message,
            top_matches=results,
            average_similarity=round(avg_sim, 4),
        )

    def _build_overused_message(
        self,
        title: str,
        similar_count: int,
        is_overused: bool,
        matches: List[SimilarityResult],
    ) -> str:
        if not is_overused:
            if similar_count == 0:
                return f"'{title}' appears to be a relatively unique idea. Good start!"
            return f"Found {similar_count} similar project(s). Consider adding a unique angle."

        duplicates = [r for r in matches if r.is_duplicate]
        msg = (
            f"⚠️  '{title}' is a very common FYP idea — "
            f"{similar_count} similar projects already exist"
        )
        if duplicates:
            msg += f", including {len(duplicates)} near-duplicate(s)."
        msg += " Consider adding a novel domain, technology, or use case to stand out."
        return msg


def compute_pairwise_similarity(texts: List[str], keys: List[str]) -> np.ndarray:
    """
    Compute the full pairwise similarity matrix for a set of texts.
    Useful for batch duplicate detection.
    Returns an (n x n) numpy matrix.
    """
    pipeline = EmbeddingPipeline()
    pipeline.fit(texts, keys)
    matrix, _ = pipeline.get_matrix()
    similarity_matrix = matrix @ matrix.T
    return similarity_matrix


def find_duplicate_clusters(
    texts: List[str],
    keys: List[str],
    threshold: float = DUPLICATE_THRESHOLD,
) -> List[List[str]]:
    """
    Group projects into clusters of near-duplicates.
    Returns list of clusters, each cluster is a list of keys.
    """
    sim_matrix = compute_pairwise_similarity(texts, keys)
    n = len(keys)
    visited = set()
    clusters = []

    for i in range(n):
        if i in visited:
            continue
        cluster = [keys[i]]
        visited.add(i)
        for j in range(i + 1, n):
            if j not in visited and sim_matrix[i][j] >= threshold:
                cluster.append(keys[j])
                visited.add(j)
        if len(cluster) > 1:
            clusters.append(cluster)

    logger.info(f"Found {len(clusters)} duplicate cluster(s) from {n} projects")
    return clusters
