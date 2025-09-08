from rest_framework import permissions
from rest_framework.permissions import BasePermission


class IsAuthenticated(BasePermission):
    """Проверяет, что пользователь авторизован"""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsAdmin(BasePermission):
    """Проверяет, что пользователь администратор"""

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsCoordinator(BasePermission):
    """Проверяет, что пользователь координатор"""

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == 'coordinator')


class IsDeputy(BasePermission):
    """Проверяет, что пользователь депутат"""

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == 'deputy')


class IsAdminOrCoordinator(BasePermission):
    """Проверяет, что пользователь admin или coordinator"""

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'coordinator']
        )
