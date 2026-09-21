from sqlalchemy import Column, Integer, String, Text, Float, DateTime, func
from sqlalchemy.dialects.postgresql import ARRAY
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    description = Column(Text, nullable=True)
    source_url = Column(String(500), nullable=True)     # original URL (GitHub, uni site, etc.)
    source_type = Column(String(50), nullable=True)     # github / university / research / manual

    # ML-extracted fields
    technologies = Column(ARRAY(String), default=[], nullable=False, server_default="{}")
    domains = Column(ARRAY(String), default=[], nullable=False, server_default="{}")
    difficulty_level = Column(String(20), nullable=True)    # beginner / intermediate / advanced
    popularity_score = Column(Float, default=0.0)           # based on stars, citations, etc.
    similarity_count = Column(Integer, default=0)           # how many similar projects exist

    # Embedding stored as JSON string (will be moved to vector DB later)
    embedding_id = Column(String(100), nullable=True)       # reference ID in vector store

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Project id={self.id} title={self.title[:40]}>"
