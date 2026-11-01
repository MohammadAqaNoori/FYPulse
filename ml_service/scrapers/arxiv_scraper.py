"""
arXiv Scraper
Uses the free arXiv API (no key needed) to collect CS research papers.
arXiv is the primary repository for cutting-edge CS/AI/ML research.
Papers here are way more advanced than typical GitHub FYP repos.

API: https://export.arxiv.org/api/
"""
import time
import xml.etree.ElementTree as ET
from typing import List
import requests
from scrapers.base_scraper import BaseScraper, ScrapedProject
from utils.text_cleaner import clean_text
from utils.logger import logger

ARXIV_API = "https://export.arxiv.org/api/query"

# arXiv categories most relevant to CS/SE final year projects
ARXIV_QUERIES = [
    # AI / ML
    ("cs.LG",  "machine learning classification prediction",     30),
    ("cs.AI",  "artificial intelligence system",                  25),
    ("cs.CV",  "computer vision object detection image",         30),
    ("cs.CL",  "natural language processing text classification", 25),
    ("cs.NE",  "neural network deep learning",                   25),
    # Systems / Engineering
    ("cs.SE",  "software engineering system design",             20),
    ("cs.DC",  "distributed system cloud computing",             15),
    ("cs.CR",  "cybersecurity intrusion detection malware",      20),
    ("cs.DB",  "database system recommendation",                 15),
    # Applied domains
    ("cs.IR",  "information retrieval recommendation system",    20),
    ("cs.RO",  "robotics autonomous navigation",                 15),
    ("eess.IV","medical image analysis healthcare",              20),
]


def _extract_domains(title: str, abstract: str, category: str) -> List[str]:
    text = (title + " " + abstract).lower()
    domains = []
    if category.startswith("cs.CV") or any(w in text for w in ["image", "vision", "detection", "recognition"]):
        domains.append("computer-vision")
    if category.startswith("cs.CL") or any(w in text for w in ["language", "text", "nlp", "sentiment", "translation"]):
        domains.append("nlp")
    if any(w in text for w in ["health", "medical", "clinical", "disease", "diagnosis", "patient"]):
        domains.append("healthcare")
    if any(w in text for w in ["finance", "stock", "trading", "fraud", "credit"]):
        domains.append("finance")
    if any(w in text for w in ["security", "attack", "malware", "intrusion", "vulnerability", "cyber"]):
        domains.append("security")
    if any(w in text for w in ["robot", "autonomous", "navigation", "drone", "slam"]):
        domains.append("robotics")
    if category.startswith("cs.LG") or any(w in text for w in ["learning", "neural", "prediction", "classification"]):
        domains.append("ai-ml")
    if any(w in text for w in ["education", "student", "learning management", "adaptive"]):
        domains.append("education")
    if any(w in text for w in ["iot", "sensor", "embedded", "smart home", "edge"]):
        domains.append("iot")
    return list(dict.fromkeys(domains))[:4] or ["ai-ml"]  # deduplicate, keep order


def _extract_techs(title: str, abstract: str) -> List[str]:
    text = (title + " " + abstract).lower()
    tech_map = {
        "transformer":  "transformer",
        "bert":         "bert",
        "gpt":          "gpt",
        "pytorch":      "pytorch",
        "tensorflow":   "tensorflow",
        "cnn":          "cnn",
        "lstm":         "lstm",
        "gan":          "gan",
        "resnet":       "resnet",
        "yolo":         "yolo",
        "opencv":       "opencv",
        "scikit":       "scikit-learn",
        "sklearn":      "scikit-learn",
        "reinforcement learning": "reinforcement-learning",
        "federated":    "federated-learning",
        "graph neural": "graph-neural-network",
        "attention":    "attention-mechanism",
        "diffusion":    "diffusion-model",
        "python":       "python",
    }
    techs = ["python"]  # most CS papers use python
    for kw, tech in tech_map.items():
        if kw in text and tech not in techs:
            techs.append(tech)
    return techs[:10]


class ArxivScraper(BaseScraper):
    """
    Scrapes cutting-edge CS research papers from arXiv.
    Returns advanced project ideas based on recent papers.
    """

    def __init__(self):
        super().__init__("arxiv")

    def scrape(self, query: str = "machine learning", max_results: int = 50) -> List[ScrapedProject]:
        """Search arXiv by query string."""
        return self._fetch(
            search_query=f"all:{query}",
            max_results=max_results,
            category="cs.LG",
        )

    def scrape_all_areas(self, max_per_query: int = 25) -> List[ScrapedProject]:
        """Scrape across multiple CS areas for diverse coverage."""
        seen_ids: set = set()
        all_projects: List[ScrapedProject] = []

        for category, query, limit in ARXIV_QUERIES:
            logger.info(f"[arXiv] {category}: '{query}'")
            results = self._fetch(
                search_query=f"cat:{category} AND all:{query}",
                max_results=min(max_per_query, limit),
                category=category,
            )
            added = 0
            for p in results:
                if p.source_url not in seen_ids:
                    seen_ids.add(p.source_url)
                    all_projects.append(p)
                    added += 1
            logger.info(f"[arXiv] {category}: added {added} (total: {len(all_projects)})")
            time.sleep(3.0)   # arXiv asks for 3s delay between requests

        logger.info(f"[arXiv] Total: {len(all_projects)} research papers")
        return all_projects

    def _fetch(self, search_query: str, max_results: int, category: str) -> List[ScrapedProject]:
        params = {
            "search_query": search_query,
            "start": 0,
            "max_results": max_results,
            "sortBy": "relevance",
            "sortOrder": "descending",
        }
        try:
            r = requests.get(ARXIV_API, params=params, timeout=20)
            r.raise_for_status()
            return self._parse_feed(r.text, category)
        except Exception as e:
            logger.error(f"[arXiv] Failed '{search_query}': {e}")
            return []

    def _parse_feed(self, xml_text: str, category: str) -> List[ScrapedProject]:
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as e:
            logger.error(f"[arXiv] XML parse error: {e}")
            return []

        projects = []
        for entry in root.findall("atom:entry", ns):
            try:
                title    = (entry.findtext("atom:title",    "", ns) or "").strip().replace("\n", " ")
                abstract = (entry.findtext("atom:summary",  "", ns) or "").strip().replace("\n", " ")
                arxiv_id = (entry.findtext("atom:id",       "", ns) or "").strip()

                if not title or len(title) < 10:
                    continue
                if not abstract or len(abstract) < 50:
                    continue

                clean_abstract = clean_text(abstract)
                domains = _extract_domains(title, clean_abstract, category)
                techs   = _extract_techs(title, clean_abstract)

                # arXiv URL is the canonical ID
                source_url = arxiv_id if arxiv_id.startswith("http") else f"https://arxiv.org/abs/{arxiv_id.split('/')[-1]}"

                projects.append(ScrapedProject(
                    title=title,
                    description=f"{clean_abstract[:800]} [Source: arXiv {category}]",
                    source_url=source_url,
                    source_type="arxiv",
                    technologies=techs,
                    domains=domains,
                    difficulty_level="advanced",
                    popularity_score=0.25,   # academic papers have no stars, set a decent base
                    raw_data={"category": category},
                ))
            except Exception:
                continue

        return projects
