import os

CHAT_ID = os.getenv("CHAT_ID")
BASE_URL = os.getenv("BASE_URL")
BOT_TOKEN = os.getenv('BOT_TOKEN')
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
