from aiogram import Router
from aiogram.types import Message
from aiogram.filters import CommandStart

from src.config import BASE_URL

router = Router()


@router.message(CommandStart())
async def start(message: Message):
    link = BASE_URL + f'invite_form?id={message.from_user.id}'
    await message.reply(
        f"Здравствуйте! Для вступления в информационный канал  депутатов ЛДПР"
        f" вам необходимо заполнить анкету участника. "
        f"Перейдите по следующей ссылке: {link}"
    )
