"""
GitHub Scraper — Advanced FYP-focused version.
Targets high-quality, starred, complex projects relevant to CS/SE final year students.
"""
import os
import math
import time
from typing import List, Optional
import requests
from dotenv import load_dotenv

from scrapers.base_scraper import BaseScraper, ScrapedProject
from utils.text_cleaner import normalize_technology, clean_text
from utils.logger import logger

load_dotenv()

GITHUB_API_URL = "https://api.github.com/search/repositories"

# ── Advanced, domain-specific queries targeting real FYP-grade projects ────────
# Each entry is (search_query, min_stars) — min_stars filters out toy projects
FYP_SEARCH_QUERIES = [
    # AI / ML
    ("machine learning final year project stars:>20", 20),
    ("deep learning project python stars:>30", 30),
    ("computer vision opencv python stars:>20", 20),
    ("natural language processing sentiment analysis stars:>20", 20),
    ("recommendation system collaborative filtering stars:>15", 15),
    ("object detection yolo python stars:>25", 25),
    ("speech recognition python deep learning stars:>15", 15),
    ("image classification cnn tensorflow stars:>20", 20),
    ("text classification bert nlp stars:>20", 20),
    ("fraud detection machine learning stars:>15", 15),
    ("disease prediction machine learning healthcare stars:>15", 15),
    ("face recognition deep learning stars:>20", 20),
    # Full-Stack Web
    ("full stack web application django react stars:>20", 20),
    ("ecommerce web app nodejs react stars:>25", 25),
    ("hospital management system django stars:>15", 15),
    ("learning management system lms stars:>20", 20),
    ("social media platform django flask stars:>15", 15),
    # Security / Blockchain
    ("intrusion detection system machine learning stars:>15", 15),
    ("blockchain ethereum smart contract stars:>25", 25),
    ("network security anomaly detection stars:>10", 10),
    # IoT / Embedded
    ("iot smart home automation raspberry pi stars:>20", 20),
    ("iot healthcare monitoring stars:>10", 10),
    # Data Science / Analytics
    ("data analysis visualization python pandas stars:>20", 20),
    ("predictive analytics dashboard python stars:>15", 15),
    ("stock price prediction lstm stars:>20", 20),
    # Mobile
    ("android app machine learning stars:>15", 15),
    ("flutter app firebase stars:>20", 20),
    # Capstone / advanced academic
    ("capstone project machine learning stars:>15", 15),
    ("undergraduate thesis deep learning stars:>10", 10),
    ("fyp artificial intelligence python stars:>10", 10),
    ("final year project computer science stars:>15", 15),
    ("final year project software engineering stars:>10", 10),
]

_ADVANCED_TOPICS = {
    "deep-learning", "machine-learning", "nlp", "computer-vision",
    "blockchain", "cybersecurity", "reinforcement-learning", "transformer",
    "bert", "gpt", "yolo", "lstm", "generative-adversarial-network",
    "object-detection", "semantic-segmentation", "recommendation-system",
}
_BEGINNER_TOPICS = {
    "html", "css", "todo", "todo-app", "beginner", "crud",
    "calculator", "snake-game", "weather-app",
}
_ADVANCED_LANGS = {"python", "julia", "r", "c++", "rust"}


def _infer_difficulty(topics: List[str], stars: int, language: str) -> str:
    topic_set = {t.lower() for t in topics}
    if topic_set & _ADVANCED_TOPICS or stars > 80 or language.lower() in _ADVANCED_LANGS:
        return "advanced"
    if topic_set & _BEGINNER_TOPICS or stars < 5:
        return "beginner"
    return "intermediate"


def _infer_domains(topics: List[str], description: str, title: str) -> List[str]:
    domain_map = {
        "healthcare":       ["health", "medical", "hospital", "disease", "diagnosis", "patient", "clinical", "drug"],
        "education":        ["education", "learning", "student", "school", "university", "e-learning", "lms", "quiz", "course"],
        "finance":          ["finance", "banking", "payment", "stock", "crypto", "budget", "trading", "fintech"],
        "ecommerce":        ["ecommerce", "shop", "store", "cart", "product", "order", "marketplace"],
        "security":         ["security", "cyber", "authentication", "encryption", "intrusion", "firewall", "vulnerability"],
        "ai-ml":            ["machine-learning", "deep-learning", "neural", "prediction", "classification", "regression", "ai", "artificial-intelligence"],
        "computer-vision":  ["computer-vision", "image", "detection", "recognition", "opencv", "yolo", "cnn", "segmentation"],
        "nlp":              ["nlp", "natural-language", "text", "sentiment", "chatbot", "bert", "gpt", "translation"],
        "iot":              ["iot", "arduino", "raspberry", "sensor", "embedded", "smart-home", "automation"],
        "social-platform":  ["social", "chat", "messaging", "community", "network", "forum"],
        "data-analytics":   ["analytics", "dashboard", "visualization", "bi", "pandas", "data-science"],
        "blockchain":       ["blockchain", "ethereum", "smart-contract", "nft", "web3", "defi"],
        "robotics":         ["robot", "autonomous", "drone", "navigation", "path-planning", "slam"],
        "environment":      ["environment", "climate", "energy", "solar", "pollution", "sustainability"],
    }
    text = " ".join(topics).lower() + " " + description.lower() + " " + title.lower()
    detected = [domain for domain, keywords in domain_map.items() if any(kw in text for kw in keywords)]
    return detected or ["general"]


class GitHubScraper(BaseScraper):
    def __init__(self):
        super().__init__("github")
        self.token = os.getenv("GITHUB_API_TOKEN", "")
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"
            logger.info("GitHub scraper: authenticated (5000 req/hr)")
        else:
            logger.warning("GITHUB_API_TOKEN not set — rate limit is 10 req/min unauthenticated")

    def scrape(self, query: str, max_results: int = 50) -> List[ScrapedProject]:
        """Search GitHub for repos matching the query, sorted by stars."""
        projects = []
        per_page = min(max_results, 30)
        pages_needed = max(1, -(-max_results // per_page))

        for page in range(1, pages_needed + 1):
            params = {
                "q": query,
                "sort": "stars",
                "order": "desc",
                "per_page": per_page,
                "page": page,
            }
            try:
                response = requests.get(GITHUB_API_URL, headers=self.headers, params=params, timeout=15)
                if response.status_code == 403:
                    logger.warning("GitHub rate limit hit — sleeping 62s")
                    time.sleep(62)
                    response = requests.get(GITHUB_API_URL, headers=self.headers, params=params, timeout=15)
                response.raise_for_status()
                items = response.json().get("items", [])
                if not items:
                    break
                for repo in items:
                    project = self._parse_repo(repo)
                    if project:
                        projects.append(project)
                logger.info(f"[GitHub] Page {page}: {len(items)} repos for '{query}'")
                time.sleep(1.5)
            except requests.RequestException as e:
                logger.error(f"[GitHub] Failed for query='{query}': {e}")
                break

        return projects[:max_results]

    def _parse_repo(self, repo: dict) -> Optional[ScrapedProject]:
        title       = (repo.get("name") or "").replace("-", " ").replace("_", " ").strip()
        description = clean_text(repo.get("description") or "")
        url         = repo.get("html_url", "")
        stars       = repo.get("stargazers_count", 0)
        forks       = repo.get("forks_count", 0)
        topics      = repo.get("topics", [])
        language    = repo.get("language") or ""

        # Skip repos with no useful content
        if not title:
            return None
        # Skip obvious non-FYP repos: too short description + no topics
        if len(description) < 10 and not topics:
            return None
        # Skip repos with zero stars and no description (likely empty/personal)
        if stars == 0 and not description:
            return None

        # Build rich description by combining GitHub readme summary with topics
        rich_desc = description
        if topics:
            rich_desc += " | Topics: " + ", ".join(topics)

        # Technologies: primary language + topic-derived tech names
        techs = []
        if language:
            techs.append(normalize_technology(language))
        for t in topics:
            norm = normalize_technology(t)
            if norm and norm not in techs:
                techs.append(norm)

        domains    = _infer_domains(topics, description, title)
        difficulty = _infer_difficulty(topics, stars, language)

        # Normalize popularity: log scale 0→1, cap at 10k stars
        popularity = round(math.log10(stars + 1) / math.log10(10001), 4) if stars > 0 else 0.0

        return ScrapedProject(
            title=title.title(),
            description=rich_desc,
            source_url=url,
            source_type="github",
            technologies=techs[:15],
            domains=domains,
            difficulty_level=difficulty,
            popularity_score=popularity,
            raw_data={"stars": stars, "forks": forks, "language": language, "topics": topics},
        )

    def scrape_advanced_fyps(self, max_per_query: int = 30) -> List[ScrapedProject]:
        """
        Scrape all advanced FYP queries with quality filtering.
        Returns deduplicated, high-quality projects sorted by stars.
        """
        seen_urls: set = set()
        all_projects: List[ScrapedProject] = []

        for query, min_stars in FYP_SEARCH_QUERIES:
            logger.info(f"[GitHub] Query: '{query}' (min_stars={min_stars})")
            results = self.scrape(query, max_results=max_per_query)

            for p in results:
                stars = p.raw_data.get("stars", 0)
                if p.source_url not in seen_urls and stars >= min_stars:
                    seen_urls.add(p.source_url)
                    all_projects.append(p)

        # Sort by popularity (stars) descending so best projects come first
        all_projects.sort(key=lambda p: p.raw_data.get("stars", 0), reverse=True)
        logger.info(f"[GitHub] Total high-quality unique projects: {len(all_projects)}")
        return all_projects

    # Keep backward compat
    def scrape_multiple_queries(self, queries: List[str], max_per_query: int = 30) -> List[ScrapedProject]:
        seen: set = set()
        all_p: List[ScrapedProject] = []
        for q in queries:
            for p in self.scrape(q, max_results=max_per_query):
                if p.source_url not in seen:
                    seen.add(p.source_url)
                    all_p.append(p)
        return all_p

    def scrape_fyp_projects(self, max_per_query: int = 20) -> List[ScrapedProject]:
        return self.scrape_advanced_fyps(max_per_query=max_per_query)
