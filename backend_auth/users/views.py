from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from users.models import User
from ldpr_form.permissions import IsAdmin, IsAuthenticated, IsAdminOrCoordinator
from .serializers import UserSerializer, UserListSerializer
from .services import get_user_list


class UserListAPIView(APIView):
    """
    API View для получения списка пользователей с анкетами.
    """
    permission_classes = [IsAdminOrCoordinator]

    def get(self, request):
        users = get_user_list(auth_user=request.user)
        serializer = UserListSerializer(users, many=True)
        return Response(serializer.data)


class UserDetailAPIView(APIView):
    """
    API View для получения конкретного пользователя с анкетой.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        if user_id != request.user.user_id and request.user.role not in ["admin", "coordinator"]:
            self.permission_denied(
                request,
                message=getattr("Недостаточно прав", 'message', None),
                code=getattr(402, 'code', None)
            )
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
