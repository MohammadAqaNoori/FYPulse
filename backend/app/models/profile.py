from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Academic info
    degree = Column(String(100), nullable=True)         # e.g. "BSc Computer Science"
    university = Column(String(150), nullable=True)
    year_of_study = Column(Integer, nullable=True)      # 1-4

    # Skills & interests (stored as PostgreSQL arrays)
    skills = Column(ARRAY(String), default=[], nullable=False, server_default="{}")
    interests = Column(ARRAY(String), default=[], nullable=False, server_default="{}")
    technologies = Column(ARRAY(String), default=[], nullable=False, server_default="{}")

    # Preferences
    knowledge_level = Column(String(20), nullable=True)     # beginner / intermediate / advanced
    preferred_project_type = Column(String(50), nullable=True)  # e.g. web, mobile, AI, IoT
    preferred_team_size = Column(Integer, nullable=True)    # 1-5

    bio = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # relationships
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<Profile user_id={self.user_id} degree={self.degree}>"
