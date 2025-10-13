import logging

from rest_framework import viewsets
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from users.models import RegistrationForm, User
from .serializers import RegistrationFormSerializer, UserCreationSerializer, \
    ProcessFormSerializer
from .services import process_form, UserIsActiveError, NotifyError
from .permissions import IsAdminOrCoordinator

logger = logging.getLogger(__name__)


class RegistrationFormViewSet(viewsets.ModelViewSet):
    """
    API View для создания новой анкеты депутата.
    Обрабатывает только POST-запросы для создания ресурсов.
    """
    queryset = RegistrationForm.objects.filter(
        user__is_active=False
    )
    serializer_class = RegistrationFormSerializer
    permission_classes = [IsAdminOrCoordinator]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        user_serializer = UserCreationSerializer(data=request.data)
        if not user_serializer.is_valid():
            logger.error(f"Validation user errors: {user_serializer.errors}")
            return Response(
                {'errors': user_serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        user_serializer.save()

        form_data = request.data.copy()
        serializer = self.get_serializer(data=form_data)
        if not serializer.is_valid():
            logger.error(f"Validation form errors: {serializer.errors}")
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_permissions(self):
        if self.action == 'create':
            return []
        return super().get_permissions()


class ProcessFormViewSet(viewsets.ViewSet):
    """
    ViewSet для управления статусом пользователей
    """
    serializer_class = ProcessFormSerializer
    permission_classes = [IsAdminOrCoordinator]

    @action(detail=False, methods=['post'])
    def process_form(self, request):
        serializer = ProcessFormSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    'status': 'error',
                    'message': 'Ошибка валидации',
                    'errors': serializer.errors,
                    'input_data': request.data
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        data = serializer.validated_data
        user_id = data['user_id']
        status_value = data['status']
        message = data.get('message', '')

        try:
            if status_value:
                with transaction.atomic():
                    process_form(user_id, status_value, message)
            else:
                process_form(user_id, status_value, message)
        except User.DoesNotExist:
            return Response(
                {
                    'status': 'error',
                    'message': f'Пользователь с ID {user_id} не найден',
                    'input_data': request.data
                },
                status=status.HTTP_404_NOT_FOUND
            )
        except UserIsActiveError:
            return Response(
                {
                    'status': 'error',
                    'message': f'Пользователь с ID {user_id} уже подтверждён',
                    'input_data': request.data
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except NotifyError:
            return Response(
                {
                    'status': 'error' if status_value else 'success',
                    'message': f'Ошибка при отправке сообщения в телеграм 'if status_value else 'Пользователь не получил уведомление об отклонении заявки.',
                    'input_data': request.data
                },
                status=status.HTTP_400_BAD_REQUEST if status_value else status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error processing user status: {e}")
            return Response(
                {
                    'status': 'error',
                    'message': 'Внутренняя ошибка сервера',
                    'error': str(e),
                    'input_data': request.data
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        return Response(
            {
                'status': 'success',
                'message': f'Пользователь успешно {"подтверждён" if status_value else "удалён"}',
                'input_data': request.data
            },
            status=status.HTTP_202_ACCEPTED
        )
