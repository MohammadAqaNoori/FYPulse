"""
Papers With Code Scraper
Uses the free public Papers With Code API — no auth needed.
Returns ML/AI research projects with code implementations.
This is gold for FYP data: real research-grade projects with code.

API docs: https://paperswithcode.com/api/v1/docs/
"""
import time
from typing import List
import requests
from scrapers.base_scraper import BaseScraper, ScrapedProject
from utils.text_cleaner import clean_text, normalize_technology
from utils.logger import logger

BASE_URL = "https://paperswithcode.com/api/v1"

# Task areas relevant to CS/SE final year students
RELEVANT_TASKS = [
    "image-classification",
    "object-detection",
    "sentiment-analysis",
    "named-entity-recognition",
    "question-answering",
    "text-classification",
    "machine-translation",
    "image-segmentation",
    "face-recognition",
    "speech-recognition",
    "anomaly-detection",
    "recommendation-systems",
    "time-series-forecasting",
    "fraud-detection",
    "disease-prediction",
    "action-recognition",
    "image-generation",
    "text-generation",
    "reinforcement-learning",
    "graph-neural-networks",
]

AREA_DOMAIN_MAP = {
    "computer-vision":       ["computer-vision", "ai-ml"],
    "natural-language-processing": ["nlp", "ai-ml"],
    "medical":               ["healthcare", "ai-ml"],
    "graphs":                ["data-analytics", "ai-ml"],
    "audio":                 ["ai-ml"],
    "time-series":           ["data-analytics", "finance"],
    "reinforcement-learning":["ai-ml", "robotics"],
    "generative-models":     ["ai-ml"],
    "anomaly-detection":     ["security", "ai-ml"],
}


def _map_area_to_domains(area: str, title: str, abstract: str) -> List[str]:
    domains = AREA_DOMAIN_MAP.get(area.lower(), ["ai-ml"])
    text = (title + " " + abstract).lower()
    if any(w in text for w in ["health", "medical", "disease", "hospital", "drug", "clinical"]):
        if "healthcare" not in domains:
            domains.append("healthcare")
    if any(w in text for w in ["finance", "stock", "crypto", "fraud", "trading", "bank"]):
        if "finance" not in domains:
            domains.append("finance")
    if any(w in text for w in ["security", "attack", "malware", "intrusion", "vulnerability"]):
        if "security" not in domains:
            domains.append("security")
    if any(w in text for w in ["education", "student", "learning", "school", "teacher"]):
        if "education" not in domains:
            domains.append("education")
    return domains[:4] or ["ai-ml"]


class PapersWithCodeScraper(BaseScraper):
    """
    Scrapes research papers + code from paperswithcode.com.
    Returns ScrapedProject objects with real academic titles,
    abstracts, and code repository links.
    """

    def __init__(self):
        super().__init__("paperswithcode")
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "FYPulseBot/1.0 (github.com/MohammadAqaNoori/FYPulse)"
        })

    def scrape(self, query: str = "", max_results: int = 100) -> List[ScrapedProject]:
        """Scrape by searching papers with code implementations."""
        projects = []
        page = 1
        per_page = min(max_results, 50)

        while len(projects) < max_results:
            try:
                params = {
                    "page": page,
                    "items_per_page": per_page,
                    "ordering": "-github_stars",   # best-starred first
                }
                if query:
                    params["q"] = query

                r = self.session.get(f"{BASE_URL}/papers/", params=params, timeout=15)
                r.raise_for_status()
                data = r.json()
                results = data.get("results", [])

                if not results:
                    break

                for paper in results:
                    p = self._parse_paper(paper)
                    if p:
                        projects.append(p)

                logger.info(f"[PapersWithCode] Page {page}: {len(results)} papers")

                if not data.get("next"):
                    break
                page += 1
                time.sleep(1.0)

            except Exception as e:
                logger.error(f"[PapersWithCode] Error on page {page}: {e}")
                break

        return projects[:max_results]

    def scrape_by_tasks(self, max_per_task: int = 15) -> List[ScrapedProject]:
        """Scrape papers across multiple ML tasks for diverse coverage."""
        seen_urls: set = set()
        all_projects: List[ScrapedProject] = []

        for task in RELEVANT_TASKS:
            logger.info(f"[PapersWithCode] Task: {task}")
            try:
                r = self.session.get(
                    f"{BASE_URL}/papers/",
                    params={"q": task.replace("-", " "), "items_per_page": max_per_task,
                            "ordering": "-github_stars"},
                    timeout=15
                )
                r.raise_for_status()
                papers = r.json().get("results", [])

                for paper in papers:
                    p = self._parse_paper(paper, task_hint=task)
                    if p and p.source_url not in seen_urls:
                        seen_urls.add(p.source_url)
                        all_projects.append(p)

                logger.info(f"[PapersWithCode] {task}: {len(papers)} papers (total: {len(all_projects)})")
                time.sleep(1.2)

            except Exception as e:
                logger.error(f"[PapersWithCode] Failed task {task}: {e}")

        logger.info(f"[PapersWithCode] Total: {len(all_projects)} unique research projects")
        return all_projects

    def _parse_paper(self, paper: dict, task_hint: str = "") -> ScrapedProject | None:
        title    = (paper.get("title") or "").strip()
        abstract = clean_text(paper.get("abstract") or "")
        url      = paper.get("url_abs") or paper.get("paper_page") or ""
        arxiv_id = paper.get("arxiv_id") or ""

        if not title or len(title) < 10:
            return None
        if not abstract or len(abstract) < 30:
            return None

        # Build canonical URL
        if arxiv_id:
            source_url = f"https://arxiv.org/abs/{arxiv_id}"
        elif url:
            source_url = url if url.startswith("http") else f"https://paperswithcode.com{url}"
        else:
            return None

        # Extract technologies from abstract
        tech_hints = {
            "pytorch": "pytorch", "tensorflow": "tensorflow", "keras": "keras",
            "bert": "bert", "gpt": "gpt", "transformer": "transformer",
            "cnn": "cnn", "lstm": "lstm", "gan": "gan",
            "sklearn": "scikit-learn", "scikit": "scikit-learn",
            "opencv": "opencv", "yolo": "yolo",
            "python": "python", "java": "java", "c++": "c++",
            "huggingface": "huggingface", "fastapi": "fastapi",
        }
        technologies = []
        text_lower = (title + " " + abstract).lower()
        for kw, tech in tech_hints.items():
            if kw in text_lower and tech not in technologies:
                technologies.append(tech)

        # Always include python for ML papers
        if "python" not in technologies:
            technologies.insert(0, "python")

        area = paper.get("area", task_hint or "")
        domains = _map_area_to_domains(area, title, abstract)

        # Stars from best repo
        repos = paper.get("repositories", [])
        stars = max((r.get("stars", 0) for r in repos), default=0) if repos else 0

        import math
        popularity = round(math.log10(stars + 1) / math.log10(10001), 4) if stars > 0 else 0.1

        # Add code repo URL to description if available
        code_url = ""
        if repos:
            code_url = repos[0].get("url", "")
        rich_desc = abstract
        if code_url:
            rich_desc += f" | Code: {code_url}"

        return ScrapedProject(
            title=title,
            description=rich_desc,
            source_url=source_url,
            source_type="paperswithcode",
            technologies=technologies[:12],
            domains=domains,
            difficulty_level="advanced",   # all research papers are advanced
            popularity_score=popularity,
            raw_data={"stars": stars, "arxiv_id": arxiv_id, "area": area},
        )
