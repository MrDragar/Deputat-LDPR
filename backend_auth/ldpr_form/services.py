import logging
import string

from django.utils.crypto import get_random_string

from web.celery_app import celery_app
from users.models import User

logger = logging.getLogger(__name__)


class UserIsActiveError(Exception):
    ...


class NotifyError(Exception):
    ...


class InvitingError(Exception):
    ...


def process_form(user_id: int, status: bool, reason: str):
    user = User.objects.get(user_id=user_id)
    if user.is_active:
        raise UserIsActiveError()

    if status:
        password = get_random_string(10, string.ascii_lowercase)
        user.set_password(password)
        user.login = f"{user.deputy_form.last_name}{user.deputy_form.first_name[0]}{user.deputy_form.middle_name[0]}".strip()
        user.is_active = True
        user.save()

        message = "Поздравляем, вы прошли верефикацию. \n" \
                  "Ваши данные для входа в систему: \n" \
                  f"Логин: {user.login}\n" \
                  f"Пароль: {password}"
    else:
        message = "К сожалению, ваша анкета не прошла проверку.\n" \
                  "Причина отклонения анкеты: \n\n" \
                  f"{reason}"
        user.delete()

    result = celery_app.send_task("src.tasks.send_message",
                                  args=(user_id, message)).get()
    logger.info(result)
    if result["status"] != "success":
        raise NotifyError(result["message"])
    if status:
        result = celery_app.send_task("src.tasks.accept_deputat",
                                      args=(user_id, )).get()
        if result["status"] != "success":
            raise NotifyError(result["message"])
