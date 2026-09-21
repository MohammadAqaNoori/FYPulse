from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, func, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)

    match_score = Column(Float, nullable=False)   # 0.0 - 1.0

    # Breakdown of why it matched — stored as JSON
    # e.g. {"skills": 0.9, "interests": 0.85, "difficulty": 0.7}
    match_breakdown = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # relationships
    user = relationship("User")
    project = relationship("Project")

    def __repr__(self):
        return f"<Recommendation user={self.user_id} project={self.project_id} score={self.match_score}>"
