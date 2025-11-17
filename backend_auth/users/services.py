from django.db.models import QuerySet
from rest_framework.exceptions import PermissionDenied

from users.models import User


def get_user_list(auth_user: User) -> QuerySet[User]:
    users = User.objects.filter(is_active=True).exclude(role='admin')
    if auth_user.role == "coordinator":
        if not auth_user.deputy_form:
            raise PermissionDenied("User doesn't have information about the deputy form")
        users = users.filter(deputy_form__region=auth_user.deputy_form.region)
    return users
