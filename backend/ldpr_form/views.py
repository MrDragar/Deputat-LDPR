# ldpr_form/views.py
import logging

from rest_framework import generics # Import generics
# from rest_framework import viewsets # ModelViewSet больше не нужен
from rest_framework.response import Response
from rest_framework import status
from .models import RegistrationForm
from .serializers import RegistrationFormSerializer

class RegistrationFormCreateView(generics.CreateAPIView): # Изменено на CreateAPIView
    """
    API View для создания новой анкеты депутата.
    Обрабатывает только POST-запросы для создания ресурсов.
    """
    queryset = RegistrationForm.objects.all() # Желательно оставить для общих настроек
    serializer_class = RegistrationFormSerializer

    # generics.CreateAPIView уже имеет метод .create() и .post()
    # поэтому явно переопределять их не обязательно, если не нужна кастомная логика.
    # Если вы хотите добавить специфичную логику после сохранения, используйте perform_create:
    # def perform_create(self, serializer):
    #     instance = serializer.save()
    #     # Дополнительная логика, например, отправка уведомления или логирование
    #     # print(f"Новая анкета создана: {instance.first_name} {instance.last_name}")

    # Если вы хотите изменить ответ после успешного создания:
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # if not serializer.is_valid():
            logging.error(f"Validation errors: {serializer.errors}")
            raise Exception()
        self.perform_create(serializer)
        # custom_response_data = {"message": "Анкета успешно создана!", "id": serializer.data['id']}
        # return Response(custom_response_data, status=status.HTTP_201_CREATED)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
#