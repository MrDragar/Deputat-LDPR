import logging

from rest_framework import viewsets
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django.db import transaction

from users.models import RegistrationForm, User
from .serializers import RegistrationFormSerializer, UserCreationSerializer, \
    ProcessFormSerializer, RegistrationFormListSerializer
from .services import process_form, UserIsActiveError, NotifyError
from .permissions import IsAdminOrCoordinator

regFormCreationLogger = logging.getLogger("regFormCreationLogger")


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

    def get_serializer_class(self):
        if self.action == 'list':
            return RegistrationFormListSerializer
        return RegistrationFormSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        user_serializer = UserCreationSerializer(data=request.data.copy())
        serializer = self.get_serializer(data=request.data.copy())
        try:
            user_serializer.is_valid(raise_exception=True)
            user_serializer.save()

            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

        except Exception as e:
            regFormCreationLogger.error(f"Error creating form by {request.data.get('middle_name')} {request.data.get('first_name')} {request.data.get('last_name')}:\n{e} ", extra={"request": request})
            raise
        headers = self.get_success_headers(serializer.data)
        regFormCreationLogger.info(f"Created form by {serializer.data['middle_name']} {serializer.data['first_name']} {serializer.data['last_name']}", extra={"request": request, 'saved_data': serializer.data})
        return Response(serializer.data, status=status.HTTP_201_CREATED,
                        headers=headers)

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
        serializer.is_valid(raise_exception=True)
        # if not serializer.is_valid():
        #     return Response(
        #         {
        #             'status': 'error',
        #             'message': 'Ошибка валидации',
        #             'errors': serializer.errors,
        #             'input_data': request.data
        #         },
        #         status=status.HTTP_400_BAD_REQUEST
        #     )
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
            logging.error(f"Error processing user status: {e}")
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
