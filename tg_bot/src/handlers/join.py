from typing import Any

from aiogram import Router, types

from src.services.user import check_user_is_available
from src.database import get_db, get_db_sync

router = Router()


@router.chat_join_request()
async def chat_join_request_handler(chat_join_request: types.ChatJoinRequest) -> Any:
    if check_user_is_available(get_db_sync(), chat_join_request.from_user.id):
        return await chat_join_request.approve()
    await chat_join_request.decline()
