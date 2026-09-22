"""
University project scraper.
Collects FYP/capstone project titles and descriptions from public university
project showcase pages using BeautifulSoup.

Each university has its own parser since page structures differ.
Add new universities by subclassing UniversityScraper and registering in UNIVERSITY_SCRAPERS.
"""
import time
from typing import List, Optional
import requests
from bs4 import BeautifulSoup

from scrapers.base_scraper import BaseScraper, ScrapedProject
from utils.text_cleaner import clean_text, extract_keywords
from utils.logger import logger

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; FYPulseBot/1.0; +https://github.com/MohammadAqaNoori/FYPulse)"
}


class UniversityScraper(BaseScraper):
    """
    Generic university project scraper.
    Currently scrapes publicly available CS project showcases.
    """

    def __init__(self):
        super().__init__("university")

    def scrape(self, query: str, max_results: int = 50) -> List[ScrapedProject]:
        """
        Scrape project listings from registered university sources.
        `query` is used to filter results by keyword match.
        """
        all_projects = []
        for name, url, parser in _SOURCES:
            try:
                logger.info(f"[University] Scraping {name}...")
                projects = parser(url, query, max_results)
                all_projects.extend(projects)
                logger.info(f"[University] {name}: {len(projects)} projects found")
                time.sleep(2)   # polite delay
            except Exception as e:
                logger.error(f"[University] Failed to scrape {name}: {e}")
        return all_projects[:max_results]


# ── Individual university parsers ──────────────────────────────────────────────

def _parse_generic_project_page(url: str, query: str, max_results: int) -> List[ScrapedProject]:
    """
    Generic parser for simple project listing pages.
    Looks for <h2>/<h3> as titles and <p> as descriptions.
    """
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.warning(f"Could not fetch {url}: {e}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    projects = []
    query_lower = query.lower()

    # Find all heading + paragraph pairs
    for heading in soup.find_all(["h2", "h3", "h4"]):
        title = heading.get_text(strip=True)
        if not title or len(title) < 5:
            continue

        # Only include if title/description matches query keywords
        description = ""
        next_el = heading.find_next_sibling()
        if next_el and next_el.name in ["p", "div", "span"]:
            description = next_el.get_text(strip=True)

        full_text = (title + " " + description).lower()
        if query_lower and query_lower not in full_text:
            # Try partial keyword match
            query_words = query_lower.split()
            if not any(w in full_text for w in query_words):
                continue

        keywords = extract_keywords(title + " " + description)
        projects.append(ScrapedProject(
            title=title,
            description=clean_text(description),
            source_url=url,
            source_type="university",
            technologies=keywords[:8],
            domains=["general"],
            difficulty_level="intermediate",
            popularity_score=0.0,
            raw_data={"source_page": url},
        ))

        if len(projects) >= max_results:
            break

    return projects


# ── Registered sources (name, url, parser_function) ───────────────────────────
# Add more university sources here as tuples

_SOURCES = [
    (
        "MIT CSAIL Projects",
        "https://www.csail.mit.edu/research",
        _parse_generic_project_page,
    ),
    (
        "Stanford CS Projects",
        "https://cs.stanford.edu/research/areas",
        _parse_generic_project_page,
    ),
]
