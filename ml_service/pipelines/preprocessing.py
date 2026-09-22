"""
Preprocessing Pipeline
Cleans and enriches raw scraped projects before embedding/ML steps.
"""
import re
from typing import List, Optional
from dataclasses import dataclass, field

from utils.text_cleaner import clean_text, tokenize, extract_keywords, normalize_technology
from utils.logger import logger


# ── Domain keyword map ─────────────────────────────────────────────────────────

DOMAIN_KEYWORDS = {
    "healthcare":        ["health", "medical", "hospital", "disease", "patient", "diagnosis", "clinical"],
    "education":         ["education", "learning", "student", "school", "university", "lms", "elearning"],
    "finance":           ["finance", "banking", "payment", "stock", "trading", "cryptocurrency", "budget"],
    "ecommerce":         ["ecommerce", "shopping", "cart", "product", "store", "marketplace", "order"],
    "security":          ["security", "cybersecurity", "authentication", "encryption", "vulnerability"],
    "ai-ml":             ["machine learning", "deep learning", "neural network", "prediction", "classification", "regression"],
    "computer-vision":   ["image", "video", "detection", "recognition", "opencv", "yolo", "cnn"],
    "nlp":               ["natural language", "text", "sentiment", "chatbot", "translation", "bert", "gpt"],
    "iot":               ["iot", "arduino", "raspberry pi", "sensor", "smart home", "embedded"],
    "social-platform":   ["social", "chat", "messaging", "community", "forum", "network"],
    "data-analytics":    ["analytics", "dashboard", "visualization", "reporting", "bi", "power bi"],
    "blockchain":        ["blockchain", "ethereum", "smart contract", "nft", "web3", "decentralized"],
    "robotics":          ["robot", "autonomous", "drone", "navigation", "path planning"],
    "environment":       ["environment", "climate", "energy", "sustainability", "solar", "pollution"],
}

# ── Technology detection map ───────────────────────────────────────────────────

TECH_KEYWORDS = {
    "python", "javascript", "typescript", "java", "kotlin", "swift",
    "react", "vue", "angular", "nodejs", "django", "flask", "fastapi",
    "spring", "laravel", "php", "ruby", "rails",
    "tensorflow", "pytorch", "keras", "scikit-learn", "opencv",
    "mysql", "postgresql", "mongodb", "firebase", "redis",
    "docker", "kubernetes", "aws", "azure", "gcp",
    "flutter", "reactnative", "android", "ios",
    "html", "css", "tailwind", "bootstrap",
    "git", "github", "linux", "raspberry",
}


@dataclass
class ProcessedProject:
    """A project after preprocessing — ready for embedding."""
    title: str
    description: str
    combined_text: str          # title + description + technologies (for embedding)
    technologies: List[str]
    domains: List[str]
    difficulty_level: str
    popularity_score: float
    source_url: str
    source_type: str
    keywords: List[str] = field(default_factory=list)


def detect_domains(text: str) -> List[str]:
    """Detect relevant domains from text using keyword matching."""
    text_lower = text.lower()
    detected = []
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            detected.append(domain)
    return detected or ["general"]


def detect_technologies(text: str, existing_techs: List[str]) -> List[str]:
    """Detect technology mentions in text and merge with existing list."""
    text_lower = text.lower()
    detected = set(normalize_technology(t) for t in existing_techs)
    for tech in TECH_KEYWORDS:
        if tech in text_lower:
            detected.add(tech)
    return sorted(detected)


def infer_difficulty(
    technologies: List[str],
    description: str,
    popularity_score: float,
) -> str:
    """
    Infer difficulty level from tech stack and description.
    Rules:
    - Advanced: uses DL/ML frameworks, blockchain, microservices
    - Beginner: simple CRUD, HTML/CSS only, very short description
    - Intermediate: everything else
    """
    advanced_signals = {
        "tensorflow", "pytorch", "keras", "blockchain", "kubernetes",
        "microservices", "deep-learning", "reinforcement", "transformer",
        "generative", "llm", "bert", "gpt", "computer-vision",
    }
    beginner_signals = {
        "html", "css", "todo", "crud", "bootstrap", "beginner",
        "simple", "basic", "starter",
    }

    tech_set = set(normalize_technology(t) for t in technologies)
    desc_lower = description.lower()

    if tech_set & advanced_signals or any(s in desc_lower for s in advanced_signals):
        return "advanced"
    if (tech_set & beginner_signals or any(s in desc_lower for s in beginner_signals)) and popularity_score < 0.2:
        return "beginner"
    return "intermediate"


def build_combined_text(title: str, description: str, technologies: List[str], domains: List[str]) -> str:
    """
    Build the combined text used for embedding.
    Format: title repeated (gives it more weight) + description + technologies + domains
    """
    parts = [
        title, title,                           # title twice for higher weight
        description,
        " ".join(technologies),
        " ".join(domains),
    ]
    return " ".join(p for p in parts if p).strip()


def preprocess_project(
    title: str,
    description: str,
    source_url: str,
    source_type: str,
    technologies: List[str],
    domains: List[str],
    difficulty_level: Optional[str],
    popularity_score: float,
) -> ProcessedProject:
    """
    Full preprocessing for a single project.
    Steps:
    1. Clean text
    2. Detect/expand technologies
    3. Detect/expand domains
    4. Infer difficulty if not set
    5. Extract keywords
    6. Build combined text for embedding
    """
    clean_title = title.strip()
    clean_desc = clean_text(description)

    full_text = f"{clean_title} {clean_desc}"

    techs = detect_technologies(full_text, technologies)
    doms = detect_domains(full_text) if not domains or domains == ["general"] else domains
    difficulty = difficulty_level or infer_difficulty(techs, clean_desc, popularity_score)
    keywords = extract_keywords(full_text, top_n=10)
    combined = build_combined_text(clean_title, clean_desc, techs, doms)

    return ProcessedProject(
        title=clean_title,
        description=clean_desc,
        combined_text=combined,
        technologies=techs,
        domains=doms,
        difficulty_level=difficulty,
        popularity_score=popularity_score,
        source_url=source_url,
        source_type=source_type,
        keywords=keywords,
    )


def preprocess_batch(raw_projects: list) -> List[ProcessedProject]:
    """
    Preprocess a batch of raw project dicts or ScrapedProject objects.
    """
    processed = []
    for item in raw_projects:
        try:
            # Support both dict and ScrapedProject dataclass
            if isinstance(item, dict):
                p = preprocess_project(
                    title=item.get("title", ""),
                    description=item.get("description", ""),
                    source_url=item.get("source_url", ""),
                    source_type=item.get("source_type", "unknown"),
                    technologies=item.get("technologies", []),
                    domains=item.get("domains", []),
                    difficulty_level=item.get("difficulty_level"),
                    popularity_score=item.get("popularity_score", 0.0),
                )
            else:
                p = preprocess_project(
                    title=item.title,
                    description=item.description,
                    source_url=item.source_url,
                    source_type=item.source_type,
                    technologies=item.technologies,
                    domains=item.domains,
                    difficulty_level=item.difficulty_level,
                    popularity_score=item.popularity_score,
                )
            processed.append(p)
        except Exception as e:
            logger.warning(f"Failed to preprocess project '{getattr(item, 'title', '?')}': {e}")

    logger.info(f"Preprocessed {len(processed)}/{len(raw_projects)} projects successfully")
    return processed
