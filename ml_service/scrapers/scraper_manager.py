"""
Scraper Manager — orchestrates all scrapers and saves results to the database.
Run this file directly to trigger a full scrape:
    py scraper_manager.py
"""
import os
import sys
import json
from typing import List
from datetime import datetime

# Make sure imports work when run directly
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from scrapers.base_scraper import ScrapedProject
from scrapers.github_scraper import GitHubScraper
from scrapers.university_scraper import UniversityScraper
from utils.logger import logger

# ── Database setup ─────────────────────────────────────────────────────────────

DATABASE_URL = os.getenv("DATABASE_URL", "")

def _get_session():
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    return Session()


# ── Save to DB ─────────────────────────────────────────────────────────────────

def save_projects_to_db(projects: List[ScrapedProject]) -> dict:
    """
    Save scraped projects to the database.
    Skips duplicates based on source_url.
    Returns a summary dict.
    """
    # Import here to avoid circular imports
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

    # We reuse the backend models via the shared DB
    from backend_models import Project  # see note below

    db = _get_session()
    inserted = 0
    skipped = 0

    for p in projects:
        # Check for duplicate
        existing = db.query(Project).filter(Project.source_url == p.source_url).first()
        if existing:
            skipped += 1
            continue

        project = Project(
            title=p.title[:300],
            description=p.description[:5000] if p.description else None,
            source_url=p.source_url,
            source_type=p.source_type,
            technologies=p.technologies,
            domains=p.domains,
            difficulty_level=p.difficulty_level,
            popularity_score=p.popularity_score,
        )
        db.add(project)
        inserted += 1

    db.commit()
    db.close()

    return {"inserted": inserted, "skipped": skipped, "total": len(projects)}


def save_projects_to_json(projects: List[ScrapedProject], filepath: str) -> None:
    """Save scraped projects to a JSON file (useful for inspection/testing)."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    data = []
    for p in projects:
        data.append({
            "title": p.title,
            "description": p.description,
            "source_url": p.source_url,
            "source_type": p.source_type,
            "technologies": p.technologies,
            "domains": p.domains,
            "difficulty_level": p.difficulty_level,
            "popularity_score": p.popularity_score,
            "raw_data": p.raw_data,
        })
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved {len(data)} projects to {filepath}")


# ── Main orchestration ─────────────────────────────────────────────────────────

def run_all_scrapers(save_to: str = "json") -> List[ScrapedProject]:
    """
    Run all registered scrapers.

    Args:
        save_to: "json" saves to data/raw/, "db" saves to PostgreSQL

    Returns:
        All collected ScrapedProject objects
    """
    all_projects: List[ScrapedProject] = []

    # 1. GitHub scraper
    logger.info("=" * 60)
    logger.info("Starting GitHub scraper...")
    github = GitHubScraper()
    github_projects = github.scrape_fyp_projects(max_per_query=20)
    all_projects.extend(github_projects)
    logger.info(f"GitHub: collected {len(github_projects)} projects")

    # 2. University scraper
    logger.info("Starting University scraper...")
    uni = UniversityScraper()
    uni_projects = uni.scrape("final year project computer science", max_results=50)
    all_projects.extend(uni_projects)
    logger.info(f"University: collected {len(uni_projects)} projects")

    logger.info(f"Total projects collected: {len(all_projects)}")
    logger.info("=" * 60)

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if save_to == "json" or save_to == "both":
        json_path = os.path.join(
            os.path.dirname(__file__), "..", "data", "raw", f"scraped_{timestamp}.json"
        )
        save_projects_to_json(all_projects, json_path)

    if save_to == "db" or save_to == "both":
        summary = save_projects_to_db(all_projects)
        logger.info(f"DB save summary: {summary}")

    return all_projects


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="FYPulse Scraper Manager")
    parser.add_argument(
        "--save-to",
        choices=["json", "db", "both"],
        default="json",
        help="Where to save results (default: json)",
    )
    args = parser.parse_args()

    projects = run_all_scrapers(save_to=args.save_to)
    logger.info(f"Done. {len(projects)} projects collected.")
