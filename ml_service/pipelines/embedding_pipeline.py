"""
Embedding Pipeline
Converts project text into numerical vectors using TF-IDF.
These vectors are used for similarity detection and recommendations.

Why TF-IDF first?
- No GPU needed, works offline, fast, interpretable
- Later we can swap in sentence-transformers for better semantic understanding
"""
import os
import pickle
from typing import List, Optional, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

from utils.logger import logger

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "trained", "tfidf_vectorizer.pkl")
MATRIX_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "embeddings", "tfidf_matrix.pkl")
KEYS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "embeddings", "project_keys.pkl")


class EmbeddingPipeline:
    """
    Manages TF-IDF vectorization of project texts.

    Usage:
        pipeline = EmbeddingPipeline()
        pipeline.fit(texts)                         # train on all project texts
        vector = pipeline.transform_one(text)       # embed a single text
        pipeline.save()                             # persist model
        pipeline.load()                             # restore model
    """

    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),     # unigrams + bigrams
            min_df=2,               # ignore terms appearing in fewer than 2 docs
            max_df=0.85,            # ignore terms appearing in more than 85% of docs
            sublinear_tf=True,      # apply log normalization to TF
        )
        self._fitted = False
        self._matrix: Optional[np.ndarray] = None
        self._keys: List[str] = []   # project IDs corresponding to matrix rows

    def fit(self, texts: List[str], keys: List[str]) -> None:
        """
        Fit the vectorizer on all project texts and build the embedding matrix.

        Args:
            texts: list of combined_text strings (one per project)
            keys: list of project identifiers (e.g. DB IDs or URLs)
        """
        if len(texts) != len(keys):
            raise ValueError("texts and keys must have the same length")

        logger.info(f"Fitting TF-IDF on {len(texts)} documents...")
        matrix = self.vectorizer.fit_transform(texts)
        self._matrix = normalize(matrix, norm="l2").toarray()
        self._keys = keys
        self._fitted = True
        logger.info(f"Embedding matrix shape: {self._matrix.shape}")

    def transform_one(self, text: str) -> np.ndarray:
        """Embed a single text using the fitted vectorizer."""
        self._check_fitted()
        vec = self.vectorizer.transform([text])
        return normalize(vec, norm="l2").toarray()[0]

    def transform_batch(self, texts: List[str]) -> np.ndarray:
        """Embed a batch of texts."""
        self._check_fitted()
        mat = self.vectorizer.transform(texts)
        return normalize(mat, norm="l2").toarray()

    def get_matrix(self) -> Tuple[np.ndarray, List[str]]:
        """Return the full embedding matrix and corresponding keys."""
        self._check_fitted()
        return self._matrix, self._keys

    def save(self) -> None:
        """Persist the vectorizer and matrix to disk."""
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        os.makedirs(os.path.dirname(MATRIX_PATH), exist_ok=True)

        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.vectorizer, f)
        with open(MATRIX_PATH, "wb") as f:
            pickle.dump(self._matrix, f)
        with open(KEYS_PATH, "wb") as f:
            pickle.dump(self._keys, f)

        logger.info(f"Embedding model saved → {MODEL_PATH}")

    def load(self) -> bool:
        """Load persisted vectorizer and matrix. Returns True if successful."""
        try:
            with open(MODEL_PATH, "rb") as f:
                self.vectorizer = pickle.load(f)
            with open(MATRIX_PATH, "rb") as f:
                self._matrix = pickle.load(f)
            with open(KEYS_PATH, "rb") as f:
                self._keys = pickle.load(f)
            self._fitted = True
            logger.info(f"Embedding model loaded — {len(self._keys)} projects in index")
            return True
        except FileNotFoundError:
            logger.warning("No saved embedding model found. Run fit() first.")
            return False

    def _check_fitted(self):
        if not self._fitted:
            raise RuntimeError("EmbeddingPipeline is not fitted. Call fit() or load() first.")


# ── Module-level singleton ─────────────────────────────────────────────────────
_pipeline: Optional[EmbeddingPipeline] = None


def get_pipeline() -> EmbeddingPipeline:
    """Return the global pipeline instance, loading from disk if needed."""
    global _pipeline
    if _pipeline is None:
        _pipeline = EmbeddingPipeline()
        _pipeline.load()
    return _pipeline
