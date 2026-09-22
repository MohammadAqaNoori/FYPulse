from pydantic import BaseModel
from typing import List, Optional, Dict


class ScrapeRequest(BaseModel):
    source: str = "github"
    query: str = "final year project"
    max_results: int = 50


class ScrapeResponse(BaseModel):
    message: str
    source: str


class PreprocessRequest(BaseModel):
    projects: List[dict]


class RecommendRequest(BaseModel):
    user_id: int
    skills: List[str] = []
    interests: List[str] = []
    technologies: List[str] = []
    knowledge_level: str = "intermediate"
    preferred_domains: List[str] = []
    top_k: int = 10


class SimilarityRequest(BaseModel):
    title: str
    description: str = ""


class GenerateIdeasRequest(BaseModel):
    skills: List[str] = []
    interests: List[str] = []
    knowledge_level: str = "intermediate"
    count: int = 5
