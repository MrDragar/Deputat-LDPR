from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin, Group, \
    Permission
from django.core.exceptions import ValidationError
from django.db import models

from ldpr_form import constants


def validate_list_of_strings(value):
    """
    Валидатор для JSONField, чтобы убедиться, что он содержит список строк.
    """
    if not isinstance(value, list):
        raise ValidationError('Value must be a list.')
    for item in value:
        if not isinstance(item, str):
            raise ValidationError('All items in the list must be strings.')


class UserManager(BaseUserManager):
    def create_user(self, login=None, password=None, **extra_fields):
        user = self.model(login=login, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login, password=None, **extra_fields):
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(login, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.BigIntegerField(primary_key=True, blank=False)
    login = models.CharField(max_length=50, unique=True, verbose_name="Логин", null=True, blank=True)
    password = models.CharField(max_length=100, verbose_name="Пароль", null=True, blank=True)
    is_active = models.BooleanField(default=False, verbose_name="Активный")
    
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="ldpr_user_set",
        related_query_name="ldpr_user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="ldpr_user_permissions_set",  # Уникальное related_name
        related_query_name="ldpr_user_permissions",
    )

    SYSTEM_ROLES = [
        ('deputy', 'Депутат'),
        ('coordinator', 'Координатор'),
        ('admin', 'Администратор'),
    ]

    role = models.CharField(
        max_length=20,
        choices=SYSTEM_ROLES,
        default='deputy',
        verbose_name="Роль"
    )
    region = models.CharField(max_length=1023, choices=constants.make_choices_from_list(constants.REGIONS), verbose_name="Регион", null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True,
                                       verbose_name="Дата регистрации")
    last_login = models.DateTimeField(auto_now=True,
                                      verbose_name="Последний вход")
    objects = UserManager()
    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ["user_id"]

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def __str__(self):
        if self.login:
            return self.login
        if self.deputy_form:
            return (f"{self.deputy_form.first_name} "
                    f"{self.deputy_form.middle_name} "
                    f"{self.deputy_form.last_name}")
        return self.user_id

    @property
    def is_staff(self):
        return self.role in ['admin', 'coordinator']

    def has_perm(self, perm, obj=None):
        return self.is_staff

    def has_module_perms(self, app_label):
        return self.is_staff


class RegistrationForm(models.Model):
    """
    Основная модель для хранения данных анкеты депутата.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="deputy_form", null=False, primary_key=True)
    last_name = models.CharField(max_length=1023, verbose_name="Фамилия")
    first_name = models.CharField(max_length=1023, verbose_name="Имя")
    middle_name = models.CharField(max_length=1023, blank=True, verbose_name="Отчество")
    gender = models.CharField(max_length=10, choices=constants.GENDER_CHOICES, verbose_name="Пол")
    birth_date = models.DateField(verbose_name="Дата рождения")
    region = models.CharField(max_length=1023, choices=constants.make_choices_from_list(constants.REGIONS), verbose_name="Регион")
    occupation = models.CharField(max_length=1023, blank=True, verbose_name="Профессия / род занятий", default="-")
    # Контактная информация (Section 1)
    phone = models.CharField(max_length=20, verbose_name="Телефон")
    email = models.EmailField(verbose_name="Адрес электронной почты")
    vk_page = models.URLField(verbose_name="Ссылка на страницу ВКонтакте")
    vk_group = models.URLField(blank=True, verbose_name="Ссылка на сообщество ВКонтакте") # <-- blank=True
    telegram_channel = models.URLField(blank=True, verbose_name="Ссылка на телеграм-канал") # <-- blank=True
    personal_site = models.URLField(blank=True, verbose_name="Ссылка на персональный сайт") # <-- blank=True

    # Семья (Section 5)
    marital_status = models.CharField(max_length=50, choices=constants.MARITAL_STATUS_CHOICES, verbose_name="Семейное положение")
    # Все числовые поля ниже могут быть null/blank
    children_count = models.PositiveIntegerField(blank=True, null=True, verbose_name="Количество детей") # <-- null=True, blank=True
    children_male_count = models.PositiveIntegerField(blank=True, null=True, verbose_name="Из них мальчиков") # <-- null=True, blank=True
    children_female_count = models.PositiveIntegerField(blank=True, null=True, verbose_name="Из них девочек") # <-- null=True, blank=True
    underage_children_count = models.PositiveIntegerField(blank=True, null=True, verbose_name="Количество несовершеннолетних детей") # <-- null=True, blank=True
    underage_children_male_count = models.PositiveIntegerField(blank=True, null=True, verbose_name="Из них несовершеннолетних мальчиков") # <-- null=True, blank=True
    underage_children_female_count = models.PositiveIntegerField(blank=True, null=True, verbose_name="Из них несовершеннолетних девочек") # <-- null=True, blank=True

    # Партийная деятельность (Section 6)
    party_experience = models.PositiveIntegerField(verbose_name="Стаж в партии (лет)")
    party_position = models.CharField(max_length=1023, verbose_name="Должность в партии")
    # party_role stores the final value, including custom 'Другая'
    party_role = models.CharField(max_length=1023, verbose_name="Должность в региональном отделении")

    # Общественная деятельность (Section 7)
    representative_body_name = models.CharField(max_length=1023, verbose_name="Наименование представительного органа")
    representative_body_level = models.CharField(max_length=80, choices=constants.make_choices_from_list(constants.REPRESENTATIVE_BODY_LEVELS), verbose_name="Уровень представительного органа")
    representative_body_position = models.CharField(max_length=1023, verbose_name="Должность в представительном органе")
    committee_name = models.CharField(max_length=1023, verbose_name="Название комиссии или комитета")
    committee_status = models.CharField(max_length=50, choices=constants.make_choices_from_list(constants.COMMITTEE_STATUSES), verbose_name="Статус в комиссии или комитете")
    # social_organizations is a related model

    # Профессиональная деятельность (Section 8)
    professional_sphere = models.JSONField(blank=True, default=list, validators=[validate_list_of_strings], verbose_name="Сфера профессиональной деятельности")
    awards = models.TextField(blank=True, verbose_name="Имеющиеся награды") # <-- blank=True

    # Увлечения и интересы (Section 9)
    sports = models.JSONField(blank=True, default=list, validators=[validate_list_of_strings], verbose_name="Виды спорта")
    recreation = models.JSONField(blank=True, default=list, validators=[validate_list_of_strings], verbose_name="Виды активного отдыха")
    hobbies = models.JSONField(blank=True, default=list, validators=[validate_list_of_strings], verbose_name="Увлечения и интересы")

    # Обратная связь (Section 10)
    ldpr_resources = models.JSONField(blank=True, default=list, validators=[validate_list_of_strings], verbose_name="Ресурсы ЛДПР в работе")
    central_office_assistant = models.TextField(blank=True, verbose_name="Помощь сотрудников Центрального аппарата") # <-- blank=True
    knowledge_gaps = models.JSONField(blank=True, default=list, validators=[validate_list_of_strings], verbose_name="Недостающие знания")

    # Дополнительная информация (Section 11)
    # Эти поля на фронтенде были required, поэтому здесь они остаются без blank=True
    additional_info = models.TextField(verbose_name="Дополнительная информация")
    suggestions = models.TextField(verbose_name="Предложения по улучшению работы ЛДПР")
    talents = models.TextField(verbose_name="Таланты")
    knowledge_to_share = models.TextField(verbose_name="Знания, которыми готов поделиться")
    superpower = models.TextField(verbose_name="СУПЕРсила")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата последнего обновления")

    class Meta:
        verbose_name = "Анкета депутата"
        verbose_name_plural = "Анкеты депутатов"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.last_name} {self.first_name} ({self.user.user_id or 'N/A'})"


class OtherLink(models.Model):
    """Модель для хранения дополнительных ссылок."""
    form = models.ForeignKey(RegistrationForm, on_delete=models.CASCADE, related_name='other_links', verbose_name="Анкета")
    url = models.URLField(verbose_name="Ссылка")

    class Meta:
        verbose_name = "Другая ссылка"
        verbose_name_plural = "Другие ссылки"

    def __str__(self):
        return self.url


class Education(models.Model):
    """Модель для хранения информации об образовании."""
    form = models.ForeignKey(RegistrationForm, on_delete=models.CASCADE, related_name='education', verbose_name="Анкета")
    level = models.CharField(max_length=100, choices=constants.make_choices_from_list(constants.EDUCATION_LEVELS), verbose_name="Уровень образования")
    organization = models.CharField(max_length=1023, verbose_name="Название образовательной организации")
    specialty = models.CharField(max_length=1023, verbose_name="Специальность", blank=True, default="-")

    has_postgraduate = models.CharField(max_length=3, choices=constants.HAS_CHOICES, default='Нет', verbose_name="Послевузовское профессиональное образование")
    postgraduate_type = models.CharField(max_length=100, blank=True, choices=constants.make_choices_from_list(constants.POSTGRADUATE_TYPES), verbose_name="Вид послевузовского образования") # <-- blank=True
    postgraduate_organization = models.CharField(max_length=1023, blank=True, verbose_name="Наименование учреждения послевузовского образования") # <-- blank=True

    has_degree = models.CharField(max_length=3, choices=constants.HAS_CHOICES, default='Нет', verbose_name="Наличие ученой степени")
    degree_type = models.CharField(max_length=100, blank=True, choices=constants.make_choices_from_list(constants.DEGREE_TYPES), verbose_name="Ученая степень") # <-- blank=True

    has_title = models.CharField(max_length=3, choices=constants.HAS_CHOICES, default='Нет', verbose_name="Наличие ученого звания")
    title_type = models.CharField(max_length=100, blank=True, choices=constants.make_choices_from_list(constants.TITLE_TYPES), verbose_name="Ученое звание") # <-- blank=True

    class Meta:
        verbose_name = "Образование"
        verbose_name_plural = "Образование"

    def __str__(self):
        return f"{self.level} - {self.organization}"


class WorkExperience(models.Model):
    """Модель для хранения информации о местах работы."""
    form = models.ForeignKey(RegistrationForm, on_delete=models.CASCADE, related_name='work_experience', verbose_name="Анкета")
    organization = models.CharField(max_length=1023, verbose_name="Название организации")
    position = models.CharField(max_length=1023, verbose_name="Должность")
    start_date = models.CharField(max_length=50, verbose_name="Месяц и год начала работы") # Format "01.2020" as per frontend

    class Meta:
        verbose_name = "Место работы"
        verbose_name_plural = "Места работы"

    def __str__(self):
        return f"{self.position} в {self.organization}"


class ForeignLanguage(models.Model):
    """Модель для хранения информации об иностранных языках."""
    form = models.ForeignKey(RegistrationForm, on_delete=models.CASCADE, related_name='foreign_languages', verbose_name="Анкета")
    name = models.CharField(max_length=100, verbose_name="Язык")
    level = models.CharField(max_length=100, choices=constants.make_choices_from_list(constants.LANGUAGE_LEVELS), verbose_name="Уровень владения")

    class Meta:
        verbose_name = "Иностранный язык"
        verbose_name_plural = "Иностранные языки"

    def __str__(self):
        return f"{self.name} ({self.level})"


class RussianFederationLanguage(models.Model):
    """Модель для хранения информации о языках народов РФ."""
    form = models.ForeignKey(RegistrationForm, on_delete=models.CASCADE, related_name='russian_federation_languages', verbose_name="Анкета")
    name = models.CharField(max_length=100, verbose_name="Язык")
    level = models.CharField(max_length=100, choices=constants.make_choices_from_list(constants.LANGUAGE_LEVELS), verbose_name="Уровень владения")

    class Meta:
        verbose_name = "Язык народов РФ"
        verbose_name_plural = "Языки народов РФ"

    def __str__(self):
        return f"{self.name} ({self.level})"


class SocialOrganization(models.Model):
    """Модель для хранения информации об общественных организациях."""
    form = models.ForeignKey(RegistrationForm, on_delete=models.CASCADE, related_name='social_organizations', verbose_name="Анкета")
    name = models.CharField(max_length=1023, verbose_name="Название организации")
    position = models.CharField(max_length=1023, verbose_name="Должность")
    years = models.CharField(max_length=50, verbose_name="Годы участия") # Format "2018-2022" as per frontend

    class Meta:
        verbose_name = "Общественная организация"
        verbose_name_plural = "Общественные организации"

    def __str__(self):
        return f"{self.name} ({self.years})"
