"""
University Project Scraper v2
Scrapes real FYP/capstone project listings from publicly accessible university pages.
Uses BeautifulSoup with multiple parsers tailored per site.

Sources:
- Papers With Code (university papers section)
- Devpost (hackathon/capstone showcase)
- GitHub Topics: fyp, capstone-project, undergraduate-thesis
- Public university project portals
"""
import time
import re
from typing import List, Optional
import requests
from bs4 import BeautifulSoup

from scrapers.base_scraper import BaseScraper, ScrapedProject
from utils.text_cleaner import clean_text, normalize_technology
from utils.logger import logger

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

TECH_KEYWORDS = {
    "python", "java", "javascript", "typescript", "kotlin", "swift", "c++", "rust",
    "react", "vue", "angular", "nodejs", "django", "flask", "fastapi", "spring",
    "tensorflow", "pytorch", "keras", "opencv", "yolo", "bert", "gpt", "scikit-learn",
    "mysql", "postgresql", "mongodb", "firebase", "redis", "docker", "kubernetes",
    "flutter", "android", "ios", "reactnative",
    "aws", "azure", "gcp", "blockchain", "ethereum",
    "arduino", "raspberry pi", "iot",
}

DOMAIN_HINTS = {
    "healthcare":   ["health", "medical", "hospital", "disease", "diagnosis", "clinical", "drug", "covid", "cancer"],
    "education":    ["education", "learning", "student", "school", "lms", "quiz", "course", "e-learning"],
    "finance":      ["finance", "banking", "payment", "stock", "crypto", "fraud", "trading", "fintech"],
    "security":     ["security", "cyber", "authentication", "malware", "intrusion", "vulnerability"],
    "ai-ml":        ["machine learning", "deep learning", "neural network", "ai", "prediction", "classification"],
    "computer-vision": ["image", "video", "detection", "recognition", "vision", "yolo", "cnn"],
    "nlp":          ["natural language", "text", "sentiment", "chatbot", "nlp", "bert"],
    "iot":          ["iot", "arduino", "raspberry", "sensor", "smart home", "embedded"],
    "blockchain":   ["blockchain", "ethereum", "smart contract", "nft", "web3"],
    "fullstack-web":["web app", "full stack", "django", "react", "api", "rest"],
}


def _detect_techs(text: str) -> List[str]:
    text_lower = text.lower()
    return [t for t in TECH_KEYWORDS if t in text_lower][:10]


def _detect_domains(text: str) -> List[str]:
    text_lower = text.lower()
    detected = [d for d, kws in DOMAIN_HINTS.items() if any(kw in text_lower for kw in kws)]
    return detected[:4] or ["general"]


def _infer_difficulty(text: str) -> str:
    text_lower = text.lower()
    advanced = ["deep learning", "neural network", "reinforcement", "blockchain", "kubernetes",
                "microservice", "transformer", "bert", "gpt", "gan", "federated", "autonomous"]
    beginner  = ["crud", "todo", "simple", "basic", "beginner", "html css", "calculator"]
    if any(w in text_lower for w in advanced):
        return "advanced"
    if any(w in text_lower for w in beginner):
        return "beginner"
    return "intermediate"


def _fetch_html(url: str, timeout: int = 15) -> Optional[BeautifulSoup]:
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        logger.warning(f"[UniversityScraper] Could not fetch {url}: {e}")
        return None


# ── Devpost — hackathon & capstone showcase ────────────────────────────────────

def _scrape_devpost(query: str, max_results: int) -> List[ScrapedProject]:
    """
    Devpost hosts thousands of student hackathon/capstone projects.
    Public search page returns rich project cards.
    """
    projects = []
    page = 1
    per_page = min(max_results, 24)

    while len(projects) < max_results:
        url = f"https://devpost.com/software/search?query={query.replace(' ', '+')}&page={page}&per_page={per_page}"
        soup = _fetch_html(url)
        if not soup:
            break

        cards = soup.select("div.software-entry, article.hackathon-tile, div[class*='project']")
        if not cards:
            # Try alternate selectors
            cards = soup.select("li.software-item, div.gallery-item")
        if not cards:
            break

        for card in cards:
            # Title
            title_el = card.select_one("h5 a, h3 a, .software-entry-name a, a[class*='title']")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            detail_url = title_el.get("href", "")
            if detail_url and not detail_url.startswith("http"):
                detail_url = "https://devpost.com" + detail_url

            # Description
            desc_el = card.select_one("p.tagline, p.description, .challenge-description p, p")
            description = desc_el.get_text(strip=True) if desc_el else ""

            if not title or len(title) < 5:
                continue

            full_text = title + " " + description
            techs   = _detect_techs(full_text)
            domains = _detect_domains(full_text)
            diff    = _infer_difficulty(full_text)

            projects.append(ScrapedProject(
                title=title,
                description=clean_text(description),
                source_url=detail_url or url,
                source_type="devpost",
                technologies=techs,
                domains=domains,
                difficulty_level=diff,
                popularity_score=0.2,
                raw_data={"source": "devpost"},
            ))

        logger.info(f"[Devpost] Page {page}: {len(cards)} projects (total: {len(projects)})")

        # Check if there's a next page
        next_btn = soup.select_one("a[rel='next'], .pagination .next a")
        if not next_btn:
            break
        page += 1
        time.sleep(2.0)

    return projects[:max_results]


# ── GitHub Topics — fyp, capstone ─────────────────────────────────────────────

def _scrape_github_topics(topics: List[str], max_per_topic: int = 30) -> List[ScrapedProject]:
    """
    GitHub Topics pages list repos tagged with topic keywords.
    fyp, capstone-project, undergraduate-thesis, final-year-project
    """
    seen: set = set()
    projects: List[ScrapedProject] = []

    for topic in topics:
        url = f"https://github.com/topics/{topic}?per_page={max_per_topic}"
        soup = _fetch_html(url)
        if not soup:
            continue

        repo_cards = soup.select("article.border, div[class*='repo'], div.flex-shrink-0")
        if not repo_cards:
            # Try the newer GitHub layout
            repo_cards = soup.select("div.d-flex.flex-column")

        for card in repo_cards:
            title_el = card.select_one("h3 a, a[data-view-component='true'][class*='Link--primary']")
            if not title_el:
                continue

            title = title_el.get_text(strip=True).replace("-", " ").replace("_", " ")
            href  = title_el.get("href", "")
            repo_url = f"https://github.com{href}" if href.startswith("/") else href

            if repo_url in seen:
                continue
            seen.add(repo_url)

            desc_el = card.select_one("p, div[class*='color-fg-muted']")
            description = desc_el.get_text(strip=True) if desc_el else ""

            # Language badge
            lang_el = card.select_one("span[itemprop='programmingLanguage']")
            language = lang_el.get_text(strip=True).lower() if lang_el else ""

            full_text = title + " " + description + " " + language
            techs   = _detect_techs(full_text)
            if language and language not in techs:
                techs.insert(0, normalize_technology(language))

            domains = _detect_domains(full_text)
            diff    = _infer_difficulty(full_text)

            projects.append(ScrapedProject(
                title=title.title(),
                description=clean_text(description),
                source_url=repo_url,
                source_type="github-topic",
                technologies=techs[:10],
                domains=domains,
                difficulty_level=diff,
                popularity_score=0.15,
                raw_data={"topic": topic},
            ))

        logger.info(f"[GitHub Topics] '{topic}': {len(projects)} total")
        time.sleep(2.0)

    return projects


# ── Kaggle public competitions ────────────────────────────────────────────────

def _scrape_kaggle_competitions(max_results: int = 30) -> List[ScrapedProject]:
    """
    Kaggle public competitions are real DS/ML project ideas with datasets.
    Uses the public Kaggle competitions API (no key needed for public data).
    """
    projects = []
    try:
        r = requests.get(
            "https://www.kaggle.com/api/v1/competitions/list",
            params={"sortBy": "numberOfTeams", "pageSize": max_results, "search": "machine learning"},
            headers=HEADERS,
            timeout=15,
        )
        r.raise_for_status()
        comps = r.json()
    except Exception as e:
        logger.warning(f"[Kaggle] API failed: {e}")
        return []

    for comp in comps:
        title       = comp.get("title", "")
        description = clean_text(comp.get("description") or comp.get("subtitle") or "")
        url         = f"https://www.kaggle.com/c/{comp.get('ref', '')}"
        reward      = comp.get("reward", "")
        tags        = [t.get("name", "") for t in comp.get("tags", [])]

        if not title:
            continue

        full_text = title + " " + description + " " + " ".join(tags)
        techs   = _detect_techs(full_text) or ["python", "scikit-learn"]
        domains = _detect_domains(full_text)

        projects.append(ScrapedProject(
            title=f"[Kaggle] {title}",
            description=f"Kaggle competition: {description}. Tags: {', '.join(tags[:5])}",
            source_url=url,
            source_type="kaggle",
            technologies=techs,
            domains=domains,
            difficulty_level="intermediate",
            popularity_score=0.3,
            raw_data={"reward": reward, "tags": tags},
        ))

    logger.info(f"[Kaggle] {len(projects)} competitions scraped")
    return projects


# ── Main scraper class ────────────────────────────────────────────────────────

class UniversityScraper(BaseScraper):
    """
    Aggregates projects from Devpost, GitHub Topics, and Kaggle.
    All public sources with no authentication required.
    """

    def __init__(self):
        super().__init__("university")

    def scrape(self, query: str = "machine learning final year project", max_results: int = 100) -> List[ScrapedProject]:
        seen_urls: set = set()
        all_projects: List[ScrapedProject] = []

        # 1. GitHub topics
        logger.info("[UniversityScraper] Scraping GitHub topics...")
        topic_projects = _scrape_github_topics(
            ["fyp", "final-year-project", "capstone-project", "undergraduate-thesis",
             "machine-learning-project", "deep-learning-project"],
            max_per_topic=20,
        )
        for p in topic_projects:
            if p.source_url not in seen_urls:
                seen_urls.add(p.source_url)
                all_projects.append(p)

        # 2. Devpost
        logger.info("[UniversityScraper] Scraping Devpost...")
        devpost_projects = _scrape_devpost(query, max_results=40)
        for p in devpost_projects:
            if p.source_url not in seen_urls:
                seen_urls.add(p.source_url)
                all_projects.append(p)

        # 3. Kaggle competitions
        logger.info("[UniversityScraper] Scraping Kaggle competitions...")
        kaggle_projects = _scrape_kaggle_competitions(max_results=30)
        for p in kaggle_projects:
            if p.source_url not in seen_urls:
                seen_urls.add(p.source_url)
                all_projects.append(p)

        logger.info(f"[UniversityScraper] Total: {len(all_projects)} unique projects")
        return all_projects[:max_results]
