from aiogram import Router
from aiogram.types import Message
from aiogram.filters import CommandStart

from src.config import BASE_URL

router = Router()


@router.message(CommandStart())
async def start(message: Message):
    link = BASE_URL + f'registration_form?telegram_id={message.from_user.id}'
    await message.reply(
        f"Здравствуйте! Для вступления в информационный канал  депутатов ЛДПР"
        f" вам необходимо заполнить анкету участника. "
        f"Перейдите по следующей ссылке: {link}"
    )
    await message.reply(
        """🔐 Важно!

Регистрация должна быть выполнена именно с этого аккаунта Telegram. 
Ссылка уникальна и привязывает ваш аккаунт депутата к этому Telegram-ID.

Пожалуйста, не передавайте ссылку другим лицам."""
    )
