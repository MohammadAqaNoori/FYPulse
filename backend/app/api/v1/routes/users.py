from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.services.user_service import UserService
from app.schemas.user import UserResponse
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users & Profile"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Get the currently authenticated user."""
    return current_user


@router.get("/me/profile", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get the current user's profile."""
    return UserService(db).get_profile(current_user)


@router.post("/me/profile", response_model=ProfileResponse, status_code=201)
def create_profile(
    data: ProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a profile for the current user."""
    return UserService(db).create_profile(current_user, data)


@router.put("/me/profile", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update the current user's profile."""
    return UserService(db).update_profile(current_user, data)
