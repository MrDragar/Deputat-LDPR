import asyncio
from datetime import datetime
from typing import Dict, Any

from aiogram import Bot

from src.celery_app import app
from src.config import BOT_TOKEN

bot = Bot(BOT_TOKEN)


@app.task(bind=True, max_retries=3)
def accept_deputat(self, user_id: int, is_accepted: bool, **kwargs) \
        -> Dict[str, Any]:
    async def __accept_deputat():
        if not is_accepted:
            return await bot.send_message(
                chat_id=user_id,
                text=f"К сожалению, вы не прошли верефикацию. Попробуйте пройти её заново."
            )
        link = await bot.create_chat_invite_link(CHAT_ID, member_limit=1)
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
                'message_id': result.message_id,
                'chat_id': user_id,
                'timestamp': datetime.now().isoformat()
            }

        finally:
            loop.close()

    except Exception as e:
        print(f"Error sending message to {user_id}: {e}")
        raise self.retry(exc=e)
