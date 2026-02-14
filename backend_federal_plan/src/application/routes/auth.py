from dataclasses import asdict

from fastapi import APIRouter, Depends

from src.application.dependencies.auth import get_current_user
from src.application.schema.auth import MeResponse
from src.domain.entities import User

router = APIRouter(prefix="/auth")


@router.get('/me', response_model=MeResponse)
async def me(
        user: User = Depends(get_current_user)
):
    return asdict(user)
