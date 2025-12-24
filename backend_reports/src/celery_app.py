from datetime import datetime

from celery import Celery
from src.config import REDIS_URL
from typing import Optional, Dict, Any, List

client = Celery(
    'tg_bot',
    broker=REDIS_URL,
    backend=REDIS_URL,
)

client.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='Europe/Moscow',
    enable_utc=True,
)


class CeleryTaskClient:
    @staticmethod
    def create_log_data(
            message: str,
            level: str = 'INFO',
            log_id: Optional[str] = None,
            extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not log_id:
            import uuid
            log_id = str(uuid.uuid4())[:16]

        log_data = {
            'log_id': log_id,
            'message': message,
            'level': level.upper(),
            'timestamp': datetime.now().isoformat(),
        }
        if extra_data:
            log_data['extra'] = extra_data

        return log_data

    @staticmethod
    def send_log(
            message: str,
            level: str = 'INFO',
            log_id: Optional[str] = None,
            extra_data: Optional[Dict[str, Any]] = None,
            custom_chat_id: Optional[int] = None
    ) -> str:
        log_data = CeleryTaskClient.create_log_data(
            message=message,
            level=level,
            log_id=log_id,
            extra_data=extra_data
        )

        if custom_chat_id:
            log_data['custom_chat_id'] = custom_chat_id

        task = client.send_task('src.tasks.send_log_to_telegram', args=[log_data])
        return task.id

