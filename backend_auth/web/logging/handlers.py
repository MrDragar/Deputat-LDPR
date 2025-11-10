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
        if hasattr(record, 'request'):
            log_entry['request'] = self.format_request(record.request)
        if hasattr(record, 'saved_data'):
            log_entry['saved_data'] = record.saved_data

        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1])
            }

        return log_entry
    
    def format_request(self, request):
        request_data = request.data.copy()
        return {
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.GET),
            'data': self._mask_sensitive_data(request_data
                ) if request_data is not None else {},
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'ip_address': self._get_client_ip(request),
            'content_type': request.content_type,
        }

    def _mask_sensitive_data(self, data):
        """Маскирует чувствительные данные"""
        if isinstance(data, dict):
            masked = {}
            sensitive_fields = ['password', 'token', 'secret', 'key',
                                'authorization', 'credit_card', 'cvv', 'ssn',
                                'password_confirmation']

            for key, value in data.items():
                key_lower = str(key).lower()
                if any(sensitive in key_lower for sensitive in
                       sensitive_fields):
                    masked[key] = '***MASKED***'
                elif isinstance(value, dict):
                    masked[key] = self._mask_sensitive_data(value)
                elif isinstance(value, list):
                    masked[key] = [
                        self._mask_sensitive_data(item) if isinstance(item,
                                                                      dict) else
                        '***MASKED***' if any(
                            sensitive in str(item).lower() for sensitive in
                            sensitive_fields) else item
                        for item in value
                    ]
                else:
                    masked[key] = value
            return masked
        return data

    def _get_safe_headers(self, request):
        """Безопасно извлекает заголовки"""
        try:
            headers = {}
            for key, value in request.META.items():
                if key.startswith('HTTP_'):
                    header_name = key[5:].replace('_', '-').title()
                    if any(sensitive in header_name.lower() for sensitive in
                           ['authorization', 'token', 'cookie']):
                        headers[header_name] = '***MASKED***'
                    else:
                        headers[header_name] = value
            return headers
        except:
            return {}

    def _get_client_ip(self, request):
        """Получает IP клиента"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
