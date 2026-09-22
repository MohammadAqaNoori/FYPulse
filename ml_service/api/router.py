from fastapi import APIRouter, BackgroundTasks, HTTPException
from api.schemas import ScrapeRequest, ScrapeResponse, PreprocessRequest, PreprocessResponse

router = APIRouter(tags=["ML Service"])


@router.post("/scrape", response_model=ScrapeResponse)
async def trigger_scrape(request: ScrapeRequest, background_tasks: BackgroundTasks):
    """
    Trigger a scraping run in the background.
    source: "github" | "university" | "all"
    """
    from scrapers.scraper_manager import run_all_scrapers
    from scrapers.github_scraper import GitHubScraper

    if request.source == "github":
        background_tasks.add_task(_run_github_scrape, request.query, request.max_results)
    elif request.source == "all":
        background_tasks.add_task(run_all_scrapers, "json")
    else:
        raise HTTPException(status_code=400, detail=f"Unknown source: {request.source}")

    return ScrapeResponse(
        message=f"Scraping '{request.source}' started in background",
        source=request.source,
    )


@router.post("/preprocess")
async def preprocess_projects(request: PreprocessRequest):
    """
    Preprocess a list of raw project dicts.
    Returns cleaned, enriched project data ready for embedding.
    """
    from pipelines.preprocessing import preprocess_batch

    processed = preprocess_batch(request.projects)
    return {
        "total_input": len(request.projects),
        "total_processed": len(processed),
        "projects": [p.__dict__ for p in processed],
    }


@router.get("/status")
def get_status():
    """Return basic ML service status."""
    import os
    raw_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    files = os.listdir(raw_dir) if os.path.exists(raw_dir) else []
    return {
        "raw_data_files": len(files),
        "raw_files": files[-5:],   # last 5 files
    }


# ── Background task helpers ────────────────────────────────────────────────────

def _run_github_scrape(query: str, max_results: int):
    from scrapers.github_scraper import GitHubScraper
    from scrapers.scraper_manager import save_projects_to_json
    import os
    from datetime import datetime

    scraper = GitHubScraper()
    projects = scraper.scrape(query, max_results=max_results)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(os.path.dirname(__file__), "..", "data", "raw", f"github_{timestamp}.json")
    save_projects_to_json(projects, path)
