from pydantic import BaseModel
from typing import List, Optional


class ScrapeRequest(BaseModel):
    source: str = "github"          # "github" | "university" | "all"
    query: str = "final year project"
    max_results: int = 50


class ScrapeResponse(BaseModel):
    message: str
    source: str


class PreprocessRequest(BaseModel):
    projects: List[dict]            # list of raw project dicts


class PreprocessResponse(BaseModel):
    total_input: int
    total_processed: int
    projects: List[dict]
