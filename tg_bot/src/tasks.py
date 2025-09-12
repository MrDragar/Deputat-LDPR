import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

from aiogram import Bot
from asgiref.sync import async_to_sync

from src.celery_app import app
from src.config import BOT_TOKEN, CHAT_ID
from src.services.user import create_user
from src.database import get_db_sync

logger = logging.getLogger(__name__)


def get_bot():
    return Bot(BOT_TOKEN)


@app.task()
def accept_deputat(user_id: int) \
        -> Dict[str, Any]:
    async def __accept_deputat():
        bot = get_bot()
        await create_user(get_db_sync(), user_id, True)
        link = await bot.create_chat_invite_link(CHAT_ID, creates_join_request=True)
        return await bot.send_message(
            chat_id=user_id,
            text=f"Поздравляем, вы прошли верефикацию. Присоединяйтесь к чату депутатов ЛДПР: {link}"
        )

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            result = loop.run_until_complete(
                __accept_deputat()
            )

            return {
                'status': 'success',
                'timestamp': datetime.now().isoformat()
            }

        finally:
            loop.close()
    
    except Exception as e:
        logger.error(f"Error sending message to {user_id}: {e}")
        return {
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }


@app.task()
def send_message(user_id: int, message: str):
    async def __send_message():
        bot = get_bot()
        await bot.send_message(user_id, message)
    try:
        logger.info(f"Start sending message to {user_id}")

        try:
            result = async_to_sync(__send_message)()
            return {
                'status': 'success',
                'timestamp': datetime.now().isoformat()
            }
        finally:
            ...

    except Exception as e:
        logger.error(f"Error sending message to {user_id}: {e}")
        return {
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }
