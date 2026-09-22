import re
import string
from typing import List


# Common words to strip from project titles/descriptions
_STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "can", "this", "that",
    "these", "those", "it", "its", "we", "our", "you", "your", "i", "my",
    "using", "based", "system", "project", "application", "app", "platform",
}


def clean_text(text: str) -> str:
    """
    Normalize raw text:
    - lowercase
    - remove URLs
    - remove special characters
    - collapse whitespace
    """
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)          # remove URLs
    text = re.sub(r"[^a-z0-9\s\-]", " ", text)          # keep letters, digits, hyphens
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenize(text: str) -> List[str]:
    """Split cleaned text into tokens, removing stopwords."""
    cleaned = clean_text(text)
    tokens = cleaned.split()
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 2]


def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    """
    Simple frequency-based keyword extraction.
    Returns the top_n most frequent meaningful tokens.
    """
    tokens = tokenize(text)
    freq: dict = {}
    for token in tokens:
        freq[token] = freq.get(token, 0) + 1
    sorted_tokens = sorted(freq, key=lambda k: freq[k], reverse=True)
    return sorted_tokens[:top_n]


def normalize_technology(tech: str) -> str:
    """
    Normalize technology names to a consistent format.
    e.g. 'JavaScript' → 'javascript', 'node.js' → 'nodejs'
    """
    tech = tech.lower().strip()
    tech = re.sub(r"[.\s]", "", tech)   # remove dots and spaces
    aliases = {
        "js": "javascript",
        "ts": "typescript",
        "py": "python",
        "ml": "machine-learning",
        "ai": "artificial-intelligence",
        "dl": "deep-learning",
        "nlp": "natural-language-processing",
        "cv": "computer-vision",
        "nodejs": "nodejs",
        "reactjs": "react",
        "vuejs": "vue",
        "angularjs": "angular",
    }
    return aliases.get(tech, tech)
