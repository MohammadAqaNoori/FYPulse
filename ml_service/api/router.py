import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter, BackgroundTasks, HTTPException
from api.schemas import (
    ScrapeRequest, ScrapeResponse,
    PreprocessRequest,
    RecommendRequest,
    SimilarityRequest,
    GenerateIdeasRequest,
)

router = APIRouter(tags=["ML Service"])

# ── Scraping ───────────────────────────────────────────────────────────────────

@router.post("/scrape", response_model=ScrapeResponse)
async def trigger_scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """Trigger a scraping run in the background and save results to JSON."""
    if request.source == "github":
        background_tasks.add_task(_run_github_scrape, request.query, request.max_results)
    elif request.source in ("all", "university"):
        background_tasks.add_task(_run_all_scrapers)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown source: {request.source}")

    return ScrapeResponse(message=f"Scraping '{request.source}' started in background", source=request.source)


# ── Recommendations ────────────────────────────────────────────────────────────

@router.post("/recommend")
async def recommend(request: RecommendRequest):
    """
    Score all indexed projects against the student profile.
    Returns top_k ranked matches with scores and reasons.
    """
    from pipelines.recommendation_pipeline import (
        RecommendationPipeline, StudentProfile, build_candidates_from_projects
    )
    from pipelines.embedding_pipeline import EmbeddingPipeline

    ep = EmbeddingPipeline()
    loaded = ep.load()
    if not loaded:
        return {"recommendations": [], "message": "No projects indexed yet. Run /ml/scrape first."}

    # Load projects from saved JSON files
    candidates_data = _load_all_projects()
    if not candidates_data:
        return {"recommendations": [], "message": "No project data found. Run /ml/scrape first."}

    profile = StudentProfile(
        user_id=request.user_id,
        skills=request.skills,
        interests=request.interests,
        technologies=request.technologies,
        knowledge_level=request.knowledge_level,
        preferred_domains=request.preferred_domains,
    )

    candidates = build_candidates_from_projects(candidates_data)
    pipeline = RecommendationPipeline(ep)
    results = pipeline.recommend(profile, candidates, top_k=request.top_k)

    return {
        "recommendations": [
            {
                "key": r.key,
                "title": r.title,
                "match_score": r.match_score,
                "match_reasons": r.match_reasons,
                "breakdown": r.breakdown,
            }
            for r in results
        ]
    }


# ── Similarity ─────────────────────────────────────────────────────────────────

@router.post("/similarity")
async def check_similarity(request: SimilarityRequest):
    """Check if a project idea is overused or similar to existing indexed projects."""
    from pipelines.similarity_pipeline import SimilarityPipeline
    from pipelines.embedding_pipeline import EmbeddingPipeline
    from pipelines.preprocessing import preprocess_project

    ep = EmbeddingPipeline()
    loaded = ep.load()
    if not loaded:
        return {"message": "No projects indexed yet. Run /ml/scrape first.", "is_overused": False}

    # Preprocess the query
    query_proj = preprocess_project(
        title=request.title,
        description=request.description,
        source_url="query",
        source_type="query",
        technologies=[],
        domains=[],
        difficulty_level=None,
        popularity_score=0.0,
    )

    projects = _load_all_projects()
    title_map = {p.get("source_url", ""): p.get("title", "") for p in projects}

    sp = SimilarityPipeline(ep)
    report = sp.check_similarity(
        query_text=query_proj.combined_text,
        query_title=request.title,
        project_titles=title_map,
    )

    return {
        "query_title": report.query_title,
        "total_similar": report.total_similar,
        "is_overused": report.is_overused,
        "message": report.overused_message,
        "average_similarity": report.average_similarity,
        "top_matches": [
            {
                "title": m.title,
                "similarity_score": m.similarity_score,
                "is_duplicate": m.is_duplicate,
            }
            for m in report.top_matches
        ],
    }


# ── Idea Generator ─────────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_ideas(request: GenerateIdeasRequest):
    """Generate novel FYP ideas based on student profile and project trends."""
    from pipelines.idea_generator import IdeaGeneratorPipeline

    gen = IdeaGeneratorPipeline()
    projects = _load_all_projects()
    if projects:
        gen.fit(projects)

    ideas = gen.generate(
        skills=request.skills,
        interests=request.interests,
        knowledge_level=request.knowledge_level,
        count=request.count,
    )

    return {
        "ideas": [
            {
                "title": i.title,
                "description": i.description,
                "suggested_technologies": i.suggested_technologies,
                "domains": i.domains,
                "difficulty_level": i.difficulty_level,
                "novelty_score": i.novelty_score,
                "rationale": i.rationale,
            }
            for i in ideas
        ]
    }


# ── Status ─────────────────────────────────────────────────────────────────────

@router.get("/status")
def get_status():
    """Return ML service status — how many projects are indexed."""
    raw_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    files = os.listdir(raw_dir) if os.path.exists(raw_dir) else []
    projects = _load_all_projects()
    return {
        "raw_data_files": len(files),
        "total_indexed_projects": len(projects),
        "latest_files": sorted(files)[-3:] if files else [],
    }


# ── Helpers ────────────────────────────────────────────────────────────────────

def _load_all_projects() -> list:
    """Load all scraped projects from the data/raw JSON files."""
    import json
    raw_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    if not os.path.exists(raw_dir):
        return []

    all_projects = []
    for fname in sorted(os.listdir(raw_dir)):
        if not fname.endswith(".json"):
            continue
        try:
            with open(os.path.join(raw_dir, fname), "r", encoding="utf-8") as f:
                data = json.load(f)
                all_projects.extend(data)
        except Exception:
            pass

    # Deduplicate by source_url
    seen = set()
    unique = []
    for p in all_projects:
        url = p.get("source_url", "")
        if url and url not in seen:
            seen.add(url)
            unique.append(p)
    return unique


def _run_github_scrape(query: str, max_results: int):
    import json
    from scrapers.github_scraper import GitHubScraper
    from pipelines.preprocessing import preprocess_batch
    from pipelines.embedding_pipeline import EmbeddingPipeline
    from datetime import datetime

    scraper = GitHubScraper()
    raw = scraper.scrape(query, max_results=max_results)
    processed = preprocess_batch(raw)

    # Save to JSON
    data = [p.__dict__ for p in processed]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(os.path.dirname(__file__), "..", "data", "raw", f"github_{timestamp}.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Re-fit embedding model with all projects
    _refit_embeddings()


def _run_all_scrapers():
    from scrapers.scraper_manager import run_all_scrapers
    run_all_scrapers(save_to="json")
    _refit_embeddings()


def _refit_embeddings():
    """Re-fit the embedding model using all available project data."""
    from pipelines.embedding_pipeline import EmbeddingPipeline, _pipeline
    import pipelines.embedding_pipeline as ep_module

    projects = _load_all_projects()
    if not projects:
        return

    texts = [p.get("combined_text", p.get("title", "")) for p in projects]
    keys = [p.get("source_url", str(i)) for i, p in enumerate(projects)]

    ep = EmbeddingPipeline()
    ep.fit(texts, keys)
    ep.save()

    # Update the global singleton
    ep_module._pipeline = ep
