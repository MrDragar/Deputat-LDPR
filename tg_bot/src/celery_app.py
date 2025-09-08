from celery import Celery
from src.config import REDIS_URL


app = Celery(
    'tg_bot',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['src.tasks']
)

# Базовая конфигурация
app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='Europe/Moscow',
    enable_utc=True,
)

# Маршрутизация задач
app.conf.task_routes = {
    'src.tasks.send_message': {'queue': 'telegram_messages'},
    'src.tasks.process_user_data': {'queue': 'telegram_processing'},
    'src.tasks.*': {'queue': 'telegram_default'},
}

# app.autodiscover_tasks(['src'])