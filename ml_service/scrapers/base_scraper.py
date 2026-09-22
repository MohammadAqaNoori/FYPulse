from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ScrapedProject:
    """
    Unified data model for a project collected from any source.
    All scrapers must return a list of these.
    """
    title: str
    description: str
    source_url: str
    source_type: str                        # "github" | "university" | "research"
    technologies: List[str] = field(default_factory=list)
    domains: List[str] = field(default_factory=list)
    difficulty_level: Optional[str] = None  # beginner | intermediate | advanced
    popularity_score: float = 0.0           # stars, citations, views etc.
    raw_data: dict = field(default_factory=dict)  # original API/HTML response


class BaseScraper(ABC):
    """
    Abstract base class for all FYPulse scrapers.
    Every scraper must implement the `scrape` method.
    """

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def scrape(self, query: str, max_results: int = 50) -> List[ScrapedProject]:
        """
        Collect projects matching the query.

        Args:
            query: search term e.g. "machine learning final year project"
            max_results: maximum number of projects to return

        Returns:
            List of ScrapedProject instances
        """
        pass

    def _safe_get(self, data: dict, *keys, default=""):
        """Safely navigate nested dict keys."""
        for key in keys:
            if not isinstance(data, dict):
                return default
            data = data.get(key, default)
        return data or default
