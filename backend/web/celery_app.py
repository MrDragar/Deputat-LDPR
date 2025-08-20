from celery import Celery
from django.conf import settings

# Инициализация Celery клиента
celery_app = Celery('django_client')

# Используем настройки из Django settings
celery_app.config_from_object('django.conf:settings', namespace='CELERY')