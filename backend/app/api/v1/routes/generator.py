from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/generator", tags=["Idea Generator"])


@router.post("/")
def generate_ideas(
    current_user: User = Depends(get_current_active_user),
):
    """
    Generate novel FYP ideas based on the user's profile and existing project trends.
    Powered by the ML service idea generation pipeline.
    """
    # TODO: wire up ML service generator pipeline in sprint 3
    return {
        "message": "Idea generator coming in sprint 3",
        "user_id": current_user.id,
    }
