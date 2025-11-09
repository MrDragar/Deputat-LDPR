import logging
import json
from datetime import datetime
import uuid
from ..celery_app import celery_app

logger = logging.getLogger(__name__)


class CeleryJSONHandler(logging.Handler):
    """
    Обработчик, который отправляет логи через Celery
    """

    def __init__(self, level=logging.NOTSET, service_name=None):
        super().__init__(level)
        self.service_name = service_name or 'django_app'

    def emit(self, record):
        try:
            log_data = self.format_record(record)
            celery_app.send_task('src.tasks.send_log_to_telegram', args=[log_data])

        except Exception as e:
            logger.error(f"Celery handler error: {e}")
            logger.error(
                f"Failed log: {json.dumps(self.format_record(record), default=str)}")

    def format_record(self, record):
        """Форматирует запись лога в JSON"""
        log_entry = {
            'log_id': str(uuid.uuid4()),
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'service': self.service_name,
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'process_id': record.process,
            'thread_name': record.threadName,
        }

        if hasattr(record, 'log_data'):
            log_entry.update(record.log_data)

        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1])
            }

        return log_entry
