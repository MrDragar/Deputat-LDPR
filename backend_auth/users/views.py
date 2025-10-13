from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch
from users.models import User
from ldpr_form.permissions import IsAdmin
from .serializers import UserSerializer


class UserListAPIView(APIView):
    """
    API View для получения списка пользователей с анкетами.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.prefetch_related(
            Prefetch('deputy_form__education'),
            Prefetch('deputy_form__work_experience'),
            Prefetch('deputy_form__foreign_languages'),
            Prefetch('deputy_form__russian_federation_languages'),
            Prefetch('deputy_form__social_organizations'),
            Prefetch('deputy_form__other_links')
        ).all()

        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class UserDetailAPIView(APIView):
    """
    API View для получения конкретного пользователя с анкетой.
    """
    permission_classes = [IsAdmin]

    def get(self, request, user_id):
        try:
            user = User.objects.prefetch_related(
                'deputy_form__education',
                'deputy_form__work_experience',
                'deputy_form__foreign_languages',
                'deputy_form__russian_federation_languages',
                'deputy_form__social_organizations',
                'deputy_form__other_links'
            ).get(user_id=user_id)

            serializer = UserSerializer(user)
            return Response(serializer.data)

        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )