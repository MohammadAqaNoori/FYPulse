from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


KNOWLEDGE_LEVELS = {"beginner", "intermediate", "advanced"}
PROJECT_TYPES = {"web", "mobile", "ai", "iot", "desktop", "data_science", "cybersecurity", "other"}


class ProfileCreate(BaseModel):
    degree: Optional[str] = None
    university: Optional[str] = None
    year_of_study: Optional[int] = None
    skills: List[str] = []
    interests: List[str] = []
    technologies: List[str] = []
    knowledge_level: Optional[str] = None
    preferred_project_type: Optional[str] = None
    preferred_team_size: Optional[int] = None
    bio: Optional[str] = None

    @field_validator("knowledge_level")
    @classmethod
    def validate_knowledge_level(cls, v):
        if v and v not in KNOWLEDGE_LEVELS:
            raise ValueError(f"knowledge_level must be one of {KNOWLEDGE_LEVELS}")
        return v

    @field_validator("preferred_project_type")
    @classmethod
    def validate_project_type(cls, v):
        if v and v not in PROJECT_TYPES:
            raise ValueError(f"preferred_project_type must be one of {PROJECT_TYPES}")
        return v

    @field_validator("year_of_study")
    @classmethod
    def validate_year(cls, v):
        if v and not (1 <= v <= 6):
            raise ValueError("year_of_study must be between 1 and 6")
        return v

    @field_validator("preferred_team_size")
    @classmethod
    def validate_team_size(cls, v):
        if v and not (1 <= v <= 10):
            raise ValueError("preferred_team_size must be between 1 and 10")
        return v


class ProfileUpdate(ProfileCreate):
    pass


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    degree: Optional[str]
    university: Optional[str]
    year_of_study: Optional[int]
    skills: List[str]
    interests: List[str]
    technologies: List[str]
    knowledge_level: Optional[str]
    preferred_project_type: Optional[str]
    preferred_team_size: Optional[int]
    bio: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
