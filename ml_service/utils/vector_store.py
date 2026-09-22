"""
Simple JSON-based vector store for development.
Will be replaced with FAISS or pgvector in production.
"""
import json
import os
from typing import List, Optional, Dict, Tuple
import numpy as np

STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "embeddings", "vector_store.json")


def _load() -> Dict[str, List[float]]:
    if not os.path.exists(STORE_PATH):
        return {}
    with open(STORE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(store: Dict[str, List[float]]) -> None:
    os.makedirs(os.path.dirname(STORE_PATH), exist_ok=True)
    with open(STORE_PATH, "w", encoding="utf-8") as f:
        json.dump(store, f)


def add_vector(key: str, vector: List[float]) -> None:
    """Store an embedding vector by key (e.g. project ID)."""
    store = _load()
    store[key] = vector
    _save(store)


def get_vector(key: str) -> Optional[List[float]]:
    store = _load()
    return store.get(key)


def cosine_similarity(a: List[float], b: List[float]) -> float:
    va, vb = np.array(a), np.array(b)
    norm = np.linalg.norm(va) * np.linalg.norm(vb)
    if norm == 0:
        return 0.0
    return float(np.dot(va, vb) / norm)


def find_similar(
    query_vector: List[float],
    top_k: int = 10,
    exclude_keys: Optional[List[str]] = None,
) -> List[Tuple[str, float]]:
    """
    Find the top_k most similar vectors to query_vector.
    Returns list of (key, similarity_score) sorted descending.
    """
    store = _load()
    exclude = set(exclude_keys or [])
    results = []
    for key, vec in store.items():
        if key in exclude:
            continue
        score = cosine_similarity(query_vector, vec)
        results.append((key, score))
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:top_k]
