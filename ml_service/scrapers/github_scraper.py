"""
GitHub Scraper v3 — Competition-grade FYP data collection.

Strategy:
- Highly targeted queries covering every CS/SE domain
- Hard quality filters: stars, description length, non-empty tech stack
- Title deduplication using normalized fingerprints (kills LMS x10 problem)
- Pulls only genuinely complex projects (ML, AI, CV, NLP, security, IoT, etc.)
"""
import os
import math
import time
import re
from typing import List, Optional
import requests
from dotenv import load_dotenv

from scrapers.base_scraper import BaseScraper, ScrapedProject
from utils.text_cleaner import normalize_technology, clean_text
from utils.logger import logger

load_dotenv()

GITHUB_API_URL = "https://api.github.com/search/repositories"

# ── Diverse, high-quality, non-overlapping query set ──────────────────────────
# Grouped so we scrape from many domains — prevents single-domain flooding
FYP_QUERIES = [
    # ── AI / Machine Learning core ────────────────────────────────────────────
    ("machine learning python classification prediction stars:>50",    50),
    ("deep learning tensorflow image classification stars:>80",        80),
    ("deep learning pytorch object detection stars:>80",               80),
    ("nlp bert sentiment analysis python stars:>60",                   60),
    ("reinforcement learning openai gym python stars:>50",             50),
    ("generative adversarial network image synthesis stars:>60",       60),
    ("transformer model text generation stars:>60",                    60),
    ("anomaly detection machine learning python stars:>30",            30),
    ("recommendation system collaborative filtering python stars:>40", 40),
    ("time series forecasting lstm python stars:>40",                  40),

    # ── Computer Vision ───────────────────────────────────────────────────────
    ("yolo object detection real time python stars:>80",               80),
    ("face recognition deep learning python stars:>60",                60),
    ("medical image segmentation deep learning stars:>40",             40),
    ("pose estimation human action recognition stars:>40",             40),
    ("autonomous driving computer vision python stars:>50",            50),
    ("sign language recognition deep learning stars:>30",              30),
    ("plant disease detection cnn python stars:>30",                   30),

    # ── NLP / Chatbots ────────────────────────────────────────────────────────
    ("question answering bert nlp python stars:>50",                   50),
    ("text summarization transformer python stars:>40",                40),
    ("chatbot rasa nlp python stars:>40",                              40),
    ("fake news detection nlp machine learning stars:>30",             30),
    ("hate speech detection nlp python stars:>25",                     25),
    ("resume parser nlp python stars:>25",                             25),

    # ── Healthcare AI ─────────────────────────────────────────────────────────
    ("disease prediction deep learning healthcare python stars:>40",   40),
    ("medical diagnosis machine learning python stars:>30",            30),
    ("covid prediction analysis python machine learning stars:>30",    30),
    ("diabetes prediction machine learning python stars:>25",          25),
    ("mental health prediction nlp machine learning stars:>20",        20),
    ("drug discovery machine learning python stars:>30",               30),

    # ── Security / Cyber ──────────────────────────────────────────────────────
    ("intrusion detection system machine learning python stars:>30",   30),
    ("malware detection deep learning python stars:>25",               25),
    ("network anomaly detection python machine learning stars:>25",    25),
    ("vulnerability detection deep learning code stars:>20",           20),
    ("phishing detection machine learning python stars:>20",           20),

    # ── Finance / FinTech ─────────────────────────────────────────────────────
    ("stock price prediction lstm deep learning stars:>50",            50),
    ("cryptocurrency price prediction machine learning stars:>30",     30),
    ("fraud detection machine learning python stars:>40",              40),
    ("algorithmic trading python machine learning stars:>50",          50),
    ("credit risk assessment machine learning stars:>25",              25),

    # ── IoT / Embedded ────────────────────────────────────────────────────────
    ("iot smart home automation python raspberry stars:>30",           30),
    ("iot healthcare patient monitoring python stars:>20",             20),
    ("smart agriculture iot machine learning stars:>20",               20),
    ("edge computing machine learning iot python stars:>20",           20),

    # ── Full-Stack Advanced Web ───────────────────────────────────────────────
    ("django react full stack web application stars:>50",              50),
    ("fastapi react typescript full stack stars:>40",                  40),
    ("microservices architecture docker kubernetes python stars:>60",  60),
    ("real time web application websocket django stars:>30",           30),
    ("graphql api python react stars:>40",                             40),

    # ── Blockchain / Web3 ─────────────────────────────────────────────────────
    ("smart contract solidity ethereum dapp stars:>40",                40),
    ("blockchain supply chain tracking python stars:>25",              25),
    ("nft marketplace solidity react stars:>30",                       30),
    ("defi protocol ethereum python stars:>30",                        30),

    # ── Data Science / Analytics ──────────────────────────────────────────────
    ("data analysis visualization python plotly dash stars:>40",       40),
    ("exploratory data analysis machine learning python stars:>30",    30),
    ("big data analysis spark python stars:>30",                       30),
    ("climate change data analysis prediction python stars:>20",       20),
    ("social media analysis sentiment python stars:>30",               30),

    # ── Robotics / Autonomous Systems ─────────────────────────────────────────
    ("robot path planning reinforcement learning python stars:>25",    25),
    ("autonomous drone navigation deep learning stars:>20",            20),
    ("slam robot mapping python ros stars:>20",                        20),

    # ── Mobile ML ─────────────────────────────────────────────────────────────
    ("flutter machine learning tflite mobile stars:>30",               30),
    ("android machine learning tensorflow lite stars:>25",             25),
    ("react native ai mobile app stars:>25",                           25),

    # ── Education Technology (AI-powered, not just LMS) ───────────────────────
    ("intelligent tutoring system machine learning python stars:>20",  20),
    ("automated essay scoring nlp python stars:>20",                   20),
    ("adaptive learning recommendation system python stars:>20",       20),
    ("student performance prediction machine learning stars:>25",      25),
]

# Topics that indicate a project is NOT an advanced FYP
_JUNK_TOPICS = {
    "todo", "todo-app", "beginner", "tutorial", "template", "boilerplate",
    "starter", "hello-world", "demo", "example", "sample", "test",
    "homework", "assignment", "practice",
}

_ADVANCED_TOPICS = {
    "deep-learning", "machine-learning", "nlp", "computer-vision", "yolo",
    "bert", "gpt", "transformer", "reinforcement-learning", "gan",
    "blockchain", "cybersecurity", "federated-learning", "edge-computing",
    "microservices", "kubernetes", "ros", "slam", "autonomous",
}


def _title_fingerprint(title: str) -> str:
    """Normalize a title to detect near-duplicates (LMS = lms = learning management system)."""
    t = title.lower()
    t = re.sub(r'[^a-z0-9 ]', ' ', t)
    # Remove common filler words
    stop = {'the', 'a', 'an', 'for', 'with', 'using', 'based', 'project', 'system', 'app', 'application'}
    words = [w for w in t.split() if w not in stop and len(w) > 1]
    return " ".join(sorted(words[:5]))   # sort for order-invariant matching


def _quality_score(repo: dict) -> float:
    """Score 0-1 based on project quality signals."""
    stars  = repo.get("stargazers_count", 0)
    forks  = repo.get("forks_count", 0)
    topics = len(repo.get("topics", []))
    desc   = len(repo.get("description") or "")
    watchers = repo.get("watchers_count", 0)

    score = 0.0
    score += min(stars / 500, 0.4)      # up to 40% from stars
    score += min(forks / 100, 0.2)      # up to 20% from forks
    score += min(topics / 8,  0.15)     # up to 15% from topics
    score += min(desc / 200,  0.15)     # up to 15% from description length
    score += min(watchers / 200, 0.10)  # up to 10% from watchers
    return round(score, 4)


def _infer_difficulty(topics: List[str], stars: int, language: str) -> str:
    topic_set = {t.lower() for t in topics}
    if topic_set & _ADVANCED_TOPICS or stars > 100:
        return "advanced"
    if stars < 5 or (topic_set & _JUNK_TOPICS):
        return "beginner"
    return "intermediate"


def _infer_domains(topics: List[str], description: str, title: str) -> List[str]:
    domain_map = {
        "healthcare":      ["health", "medical", "hospital", "disease", "diagnosis", "patient", "clinical", "drug", "covid", "cancer", "diabetes", "mental"],
        "education":       ["education", "learning", "student", "school", "university", "tutoring", "quiz", "course", "adaptive", "essay", "exam"],
        "finance":         ["finance", "banking", "payment", "stock", "crypto", "budget", "trading", "fraud", "credit", "fintech", "insurance"],
        "ecommerce":       ["ecommerce", "shop", "store", "cart", "product", "order", "marketplace", "retail"],
        "security":        ["security", "cyber", "authentication", "encryption", "intrusion", "malware", "firewall", "vulnerability", "phishing"],
        "ai-ml":           ["machine-learning", "deep-learning", "neural", "prediction", "classification", "regression", "ai", "artificial-intelligence", "supervised", "unsupervised"],
        "computer-vision": ["computer-vision", "image", "detection", "recognition", "opencv", "yolo", "cnn", "segmentation", "face", "pose"],
        "nlp":             ["nlp", "natural-language", "text", "sentiment", "chatbot", "bert", "gpt", "translation", "summarization", "question-answering"],
        "iot":             ["iot", "arduino", "raspberry", "sensor", "embedded", "smart-home", "automation", "edge"],
        "social-platform": ["social", "chat", "messaging", "community", "network", "forum"],
        "data-analytics":  ["analytics", "dashboard", "visualization", "bi", "pandas", "data-science", "spark", "big-data"],
        "blockchain":      ["blockchain", "ethereum", "smart-contract", "nft", "web3", "defi", "solidity"],
        "robotics":        ["robot", "autonomous", "drone", "navigation", "path-planning", "slam", "ros"],
        "environment":     ["environment", "climate", "energy", "solar", "pollution", "sustainability", "agriculture"],
        "fullstack-web":   ["fullstack", "full-stack", "django", "react", "microservices", "api", "rest", "graphql"],
    }
    text = " ".join(topics).lower() + " " + (description or "").lower() + " " + (title or "").lower()
    detected = [domain for domain, keywords in domain_map.items() if any(kw in text for kw in keywords)]
    return detected[:4] or ["general"]   # cap at 4 domains


class GitHubScraper(BaseScraper):

    def __init__(self):
        super().__init__("github")
        self.token = os.getenv("GITHUB_API_TOKEN", "")
        self.headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
        if self.token:
            self.headers["Authorization"] = f"Bearer {self.token}"
            logger.info("GitHub scraper: authenticated (5000 req/hr)")
        else:
            logger.warning("No GITHUB_API_TOKEN — rate limited to 10 req/min")

    def scrape(self, query: str, max_results: int = 50) -> List[ScrapedProject]:
        projects, per_page = [], min(max_results, 30)
        for page in range(1, max(1, -(-max_results // per_page)) + 1):
            params = {"q": query, "sort": "stars", "order": "desc", "per_page": per_page, "page": page}
            try:
                r = requests.get(GITHUB_API_URL, headers=self.headers, params=params, timeout=15)
                if r.status_code == 403:
                    logger.warning("Rate limited — sleeping 62s")
                    time.sleep(62)
                    r = requests.get(GITHUB_API_URL, headers=self.headers, params=params, timeout=15)
                r.raise_for_status()
                items = r.json().get("items", [])
                if not items:
                    break
                for repo in items:
                    p = self._parse_repo(repo)
                    if p:
                        projects.append(p)
                logger.info(f"[GitHub] Page {page}: {len(items)} repos for '{query[:60]}'")
                time.sleep(1.5)
            except requests.RequestException as e:
                logger.error(f"[GitHub] Failed '{query[:40]}': {e}")
                break
        return projects[:max_results]

    def _parse_repo(self, repo: dict) -> Optional[ScrapedProject]:
        title       = (repo.get("name") or "").replace("-", " ").replace("_", " ").strip()
        description = clean_text(repo.get("description") or "")
        url         = repo.get("html_url", "")
        stars       = repo.get("stargazers_count", 0)
        topics      = repo.get("topics", [])
        language    = repo.get("language") or ""

        if not title or not url:
            return None
        # Must have either a description or topics — bare repos are useless
        if len(description) < 15 and len(topics) < 2:
            return None
        # Skip obvious junk
        if set(topics) & _JUNK_TOPICS and stars < 20:
            return None

        # Build rich description
        rich_desc = description
        if topics:
            rich_desc += " | Topics: " + ", ".join(topics[:10])

        # Technologies
        techs = []
        if language:
            techs.append(normalize_technology(language))
        for t in topics:
            n = normalize_technology(t)
            if n and n not in techs:
                techs.append(n)

        domains    = _infer_domains(topics, description, title)
        difficulty = _infer_difficulty(topics, stars, language)
        popularity = round(math.log10(stars + 1) / math.log10(10001), 4) if stars > 0 else 0.0
        quality    = _quality_score(repo)

        return ScrapedProject(
            title=title.title(),
            description=rich_desc,
            source_url=url,
            source_type="github",
            technologies=techs[:15],
            domains=domains,
            difficulty_level=difficulty,
            popularity_score=max(popularity, quality * 0.5),
            raw_data={
                "stars": stars,
                "forks": repo.get("forks_count", 0),
                "language": language,
                "topics": topics,
                "quality_score": quality,
            },
        )

    def scrape_advanced_fyps(self, max_per_query: int = 25) -> List[ScrapedProject]:
        """
        Scrape all FYP_QUERIES with quality filters and aggressive deduplication.
        Returns diverse, high-quality, non-repeated projects sorted by quality.
        """
        seen_urls:          set = set()
        seen_fingerprints:  set = set()
        all_projects: List[ScrapedProject] = []

        for query, min_stars in FYP_QUERIES:
            logger.info(f"[GitHub] '{query[:70]}' (min_stars≥{min_stars})")
            results = self.scrape(query, max_results=max_per_query)

            added = 0
            for p in results:
                stars = p.raw_data.get("stars", 0)
                if stars < min_stars:
                    continue
                if p.source_url in seen_urls:
                    continue

                # Title deduplication — skip near-identical titles
                fp = _title_fingerprint(p.title)
                if fp in seen_fingerprints:
                    continue

                seen_urls.add(p.source_url)
                seen_fingerprints.add(fp)
                all_projects.append(p)
                added += 1

            logger.info(f"[GitHub] Added {added} new unique projects (total: {len(all_projects)})")

        # Sort by quality score descending
        all_projects.sort(key=lambda p: p.raw_data.get("quality_score", 0), reverse=True)
        logger.info(f"[GitHub] Final: {len(all_projects)} diverse high-quality projects")
        return all_projects

    # backward compat
    def scrape_multiple_queries(self, queries: List[str], max_per_query: int = 30) -> List[ScrapedProject]:
        seen: set = set()
        result: List[ScrapedProject] = []
        for q in queries:
            for p in self.scrape(q, max_results=max_per_query):
                if p.source_url not in seen:
                    seen.add(p.source_url)
                    result.append(p)
        return result

    def scrape_fyp_projects(self, max_per_query: int = 20) -> List[ScrapedProject]:
        return self.scrape_advanced_fyps(max_per_query=max_per_query)
