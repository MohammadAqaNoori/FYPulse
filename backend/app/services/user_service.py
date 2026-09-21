from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repo import UserRepository
from app.models.user import User
from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse


class UserService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)
        self.db = db

    def get_profile(self, user: User) -> ProfileResponse:
        if not user.profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found. Please create your profile first.",
            )
        return ProfileResponse.model_validate(user.profile)

    def create_profile(self, user: User, data: ProfileCreate) -> ProfileResponse:
        if user.profile:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Profile already exists. Use PUT to update it.",
            )

        profile = Profile(user_id=user.id, **data.model_dump())
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return ProfileResponse.model_validate(profile)

    def update_profile(self, user: User, data: ProfileUpdate) -> ProfileResponse:
        if not user.profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found. Create it first with POST.",
            )

        profile = user.profile
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, key, value)

        self.db.commit()
        self.db.refresh(profile)
        return ProfileResponse.model_validate(profile)
