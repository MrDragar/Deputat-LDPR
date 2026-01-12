import logging
import time
import json
import uuid
from datetime import datetime
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from io import BytesIO

request_logger = logging.getLogger('loggers')


class RequestResponseLoggingMiddleware(MiddlewareMixin):
    """
    Middleware для логирования запросов и ответов в JSON формате
    """

    def __init__(self, get_response):
        super().__init__(get_response)
        self.get_response = get_response
        self.exclude_paths = getattr(settings, 'LOG_EXCLUDE_PATHS', [
            '/health/', '/metrics/', '/static/', '/media/', '/api/auth/login', '/api/auth/refresh', '/api/auth/verify'
        ])

    def __call__(self, request):
        # Пропускаем исключенные пути
        if any(path.startswith(request.path) for path in self.exclude_paths):
            return self.get_response(request)

        # Генерируем ID для отслеживания цепочки запросов
        request_id = str(uuid.uuid4())
        request.request_id = request_id

        start_time = time.time()

        # Сохраняем оригинальное тело запроса для логирования
        request_body_for_logging = self._capture_request_body(request)

        try:
            response = self.get_response(request)
            duration = time.time() - start_time

            # Определяем уровень логирования на основе статус кода
            if response.status_code == 404:
                return response
            if 200 <= response.status_code < 400:
                # Успешные запросы (2xx, 3xx) - INFO
                self.log_request(request, response, duration, request_id,
                                 request_body_for_logging)
            else:
                # Ошибки (4xx, 5xx) - ERROR
                self.log_error_response(request, response, duration, request_id,
                                        request_body_for_logging)

            return response

        except Exception as exc:
            duration = time.time() - start_time

            # Логируем необработанные исключения
            self.log_exception(request, exc, duration, request_id,
                               request_body_for_logging)

            # Пробрасываем исключение дальше
            raise

    def log_error_response(self, request, response, duration, request_id,
                           request_body=None):
        """Логирует ответы с ошибками (4xx, 5xx) с уровнем ERROR"""
        try:
            log_data = {
                'request_id': request_id,
                'type': 'error_response',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'duration_seconds': round(duration, 3),
                'request': {
                    'method': request.method,
                    'path': request.path,
                    'query_params': dict(request.GET),
                    'data': self._mask_sensitive_data(
                        request_body) if request_body is not None else {},
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'ip_address': self._get_client_ip(request),
                    'content_type': request.content_type,
                },
                'response': {
                    'status_code': response.status_code,
                    'content_type': getattr(response, 'content_type',
                                            'unknown'),
                    'size_bytes': len(response.content) if hasattr(response,
                                                                   'content') else 0,
                    'data': self._get_response_data(response),
                    # Добавляем данные ответа
                },
                'user': self._get_user_info(request),
            }

            # Логируем как ERROR
            request_logger.error(
                f"{request.method} {request.path} - {response.status_code}\n{log_data}",
                extra={'log_data': log_data}
            )

        except Exception as e:
            request_logger.error(f"Error response logging error: {e}")

    def log_exception(self, request, exception, duration, request_id,
                      request_body=None):
        """Логирует необработанные исключения с уровнем ERROR"""
        import traceback

        try:
            log_data = {
                'request_id': request_id,
                'type': 'unhandled_exception',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'duration_seconds': round(duration, 3),
                'request': {
                    'method': request.method,
                    'path': request.path,
                    'query_params': dict(request.GET),
                    'data': self._mask_sensitive_data(
                        request_body) if request_body is not None else {},
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'ip_address': self._get_client_ip(request),
                    'content_type': request.content_type,
                    'headers': self._get_safe_headers(request),
                },
                'error': {
                    'type': type(exception).__name__,
                    'message': str(exception),
                    'traceback': traceback.format_exc().split('\n'),
                },
                'user': self._get_user_info(request),
            }

            request.error(
                f"Unhandled exception in {request.method} {request.path}: {str(exception)}",
                extra={'log_data': log_data},
                exc_info=False
            )

        except Exception as e:
            request_logger.error(f"Exception logging error: {e}")

    def _get_response_data(self, response):
        """Безопасно извлекает данные из response"""
        try:
            if hasattr(response, 'data'):
                return response.data
            elif hasattr(response, 'content'):
                # Пытаемся парсить JSON ответ
                content = response.content.decode('utf-8')
                if content:
                    return json.loads(content)
            return {'note': 'response_data_not_available'}
        except:
            return {'note': 'failed_to_parse_response_data'}

    def _capture_request_body(self, request):
        """Захватывает тело запроса до его обработки"""
        try:
            if request.method in ['POST', 'PUT', 'PATCH'] and request.body:
                # Сохраняем копию тела запроса
                body_copy = BytesIO(request.body)
                try:
                    # Пытаемся парсить как JSON
                    body_copy.seek(0)
                    data = json.load(body_copy)
                    return data
                except json.JSONDecodeError:
                    # Если не JSON, возвращаем текстовое представление
                    body_copy.seek(0)
                    return {'raw_body_preview': body_copy.read().decode('utf-8',
                                                                        errors='replace')[
                                                :500]}
            elif request.method == 'GET':
                return dict(request.GET)
            else:
                return {}
        except Exception as e:
            return {'error': f'Failed to capture body: {str(e)}'}

    def log_request(self, request, response, duration, request_id,
                    request_body=None):
        """Логирует успешный запрос с уровнем INFO"""
        try:
            log_data = {
                'request_id': request_id,
                'type': 'request',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'duration_seconds': round(duration, 3),
                'request': {
                    'method': request.method,
                    'path': request.path,
                    'query_params': dict(request.GET),
                    'data': self._mask_sensitive_data(
                        request_body) if request_body is not None else {},
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'ip_address': self._get_client_ip(request),
                    'content_type': request.content_type,
                },
                'response': {
                    'status_code': response.status_code,
                    'content_type': getattr(response, 'content_type',
                                            'unknown'),
                    'size_bytes': len(response.content) if hasattr(response,
                                                                   'content') else 0,
                },
                'user': self._get_user_info(request),
            }

            # Логируем с дополнительными данными
            request_logger.info(
                f"{request.method} {request.path} - {response.status_code}.\n{log_data}",
                extra={'log_data': log_data}
            )

        except Exception as e:
            # Fallback логирование если что-то пошло не так
            request_logger.error(f"Request logging error: {e}")

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

    def _get_user_info(self, request):
        """Получает информацию о пользователе"""
        try:
            if request.user.is_authenticated:
                return {
                    'id': request.user.id,
                    'username': request.user.username,
                }
            return {'authenticated': False}
        except:
            return {'authenticated': False, 'error': 'could_not_get_user_info'}
