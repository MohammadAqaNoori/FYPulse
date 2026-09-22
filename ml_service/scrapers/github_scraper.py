import os
import time
from typing import List, Optional
import requests
from dotenv import load_dotenv

from scrapers.base_scraper import BaseScraper, ScrapedProject
from utils.text_cleaner import normalize_technology, clean_text
from utils.logger import logger

load_dotenv()

GITHUB_API_URL = "https://api.github.com/search/repositories"

# Keywords used to search for FYP-style projects
FYP_SEARCH_QUERIES = [
    "final year project",
    "fyp machine learning",
    "fyp deep learning",
    "fyp web application",
    "fyp mobile app",
    "fyp computer vision",
    "fyp nlp",
    "fyp healthcare",
    "fyp iot",
    "fyp cybersecurity",
    "final year project python",
    "final year project react",
    "capstone project ai",
    "undergraduate project machine learning",
]

# GitHub topics that hint at difficulty
_ADVANCED_TOPICS = {"deep-learning", "machine-learning", "nlp", "computer-vision", "blockchain", "cybersecurity"}
_BEGINNER_TOPICS = {"html", "css", "javascript", "todo-app", "beginner", "crud"}


def _infer_difficulty(topics: List[str], stars: int) -> str:
    topic_set = set(topics)
    if topic_set & _ADVANCED_TOPICS or stars > 100:
        return "advanced"
    if topic_set & _BEGINNER_TOPICS or stars < 5:
        return "beginner"
    return "intermediate"


def _infer_domains(topics: List[str], description: str) -> List[str]:
    """Map GitHub topics + description keywords to project domains."""
    domain_map = {
        "healthcare": ["health", "medical", "hospital", "disease", "diagnosis", "patient"],
        "education": ["education", "learning", "student", "school", "university", "e-learning"],
        "finance": ["finance", "banking", "payment", "stock", "crypto", "budget"],
        "ecommerce": ["ecommerce", "shop", "store", "cart", "product", "order"],
        "security": ["security", "cyber", "authentication", "encryption", "firewall"],
        "ai-ml": ["machine-learning", "deep-learning", "neural", "prediction", "classification"],
        "computer-vision": ["computer-vision", "image", "detection", "recognition", "opencv"],
        "nlp": ["nlp", "natural-language", "text", "sentiment", "chatbot"],
        "iot": ["iot", "arduino", "raspberry", "sensor", "embedded"],
        "social": ["social", "chat", "messaging", "community", "network"],
    }
    text = " ".join(topics) + " " + description.lower()
    detected = []
    for domain, keywords in domain_map.items():
        if any(kw in text for kw in keywords):
            detected.append(domain)
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
        else:
            logger.warning("GITHUB_API_TOKEN not set — rate limit is 10 req/min unauthenticated")

    def scrape(self, query: str, max_results: int = 50) -> List[ScrapedProject]:
        """
        Search GitHub repositories matching the query.
        Returns up to max_results ScrapedProject objects.
        """
        projects = []
        per_page = min(max_results, 30)  # GitHub max per page is 100, we use 30 to be safe
        pages_needed = -(-max_results // per_page)  # ceiling division

        for page in range(1, pages_needed + 1):
            params = {
                "q": query,
                "sort": "stars",
                "order": "desc",
                "per_page": per_page,
                "page": page,
            }

            try:
                response = requests.get(
                    GITHUB_API_URL,
                    headers=self.headers,
                    params=params,
                    timeout=10,
                )

                if response.status_code == 403:
                    logger.warning("GitHub rate limit hit. Sleeping 60 seconds...")
                    time.sleep(60)
                    response = requests.get(GITHUB_API_URL, headers=self.headers, params=params, timeout=10)

                response.raise_for_status()
                data = response.json()
                items = data.get("items", [])

                if not items:
                    break

                for repo in items:
                    project = self._parse_repo(repo)
                    if project:
                        projects.append(project)

                logger.info(f"[GitHub] Page {page}: fetched {len(items)} repos for query='{query}'")

                # Respect GitHub's rate limits — 1 request/second when authenticated
                time.sleep(1.2)

            except requests.RequestException as e:
                logger.error(f"[GitHub] Request failed for query='{query}': {e}")
                break

        return projects[:max_results]

    def _parse_repo(self, repo: dict) -> Optional[ScrapedProject]:
        """Convert a raw GitHub API repo dict into a ScrapedProject."""
        title = self._safe_get(repo, "name", default="").replace("-", " ").replace("_", " ")
        description = self._safe_get(repo, "description") or ""
        url = self._safe_get(repo, "html_url")
        stars = repo.get("stargazers_count", 0)
        topics = repo.get("topics", [])
        language = repo.get("language") or ""

        # Skip repos with no meaningful content
        if not title or (not description and not topics):
            return None

        # Build technologies list: language + topics that look like tech names
        techs = []
        if language:
            techs.append(normalize_technology(language))
        for topic in topics:
            normalized = normalize_technology(topic)
            if normalized not in techs:
                techs.append(normalized)

        domains = _infer_domains(topics, description)
        difficulty = _infer_difficulty(topics, stars)

        # Normalize popularity to 0-1 range (log scale, cap at 10000 stars)
        import math
        popularity = round(math.log10(stars + 1) / math.log10(10001), 4) if stars > 0 else 0.0

        return ScrapedProject(
            title=title.title(),
            description=clean_text(description),
            source_url=url,
            source_type="github",
            technologies=techs[:15],        # cap to 15 techs
            domains=domains,
            difficulty_level=difficulty,
            popularity_score=popularity,
            raw_data={
                "stars": stars,
                "forks": repo.get("forks_count", 0),
                "language": language,
                "topics": topics,
                "owner": self._safe_get(repo, "owner", "login"),
            },
        )

    def scrape_multiple_queries(self, queries: List[str], max_per_query: int = 30) -> List[ScrapedProject]:
        """
        Run multiple search queries and deduplicate by URL.
        """
        seen_urls = set()
        all_projects = []

        for query in queries:
            logger.info(f"[GitHub] Scraping query: '{query}'")
            results = self.scrape(query, max_results=max_per_query)
            for project in results:
                if project.source_url not in seen_urls:
                    seen_urls.add(project.source_url)
                    all_projects.append(project)

        logger.info(f"[GitHub] Total unique projects collected: {len(all_projects)}")
        return all_projects

    def scrape_fyp_projects(self, max_per_query: int = 20) -> List[ScrapedProject]:
        """Convenience method — scrape all FYP-related queries."""
        return self.scrape_multiple_queries(FYP_SEARCH_QUERIES, max_per_query=max_per_query)
