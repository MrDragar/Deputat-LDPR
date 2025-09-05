from rest_framework import serializers
from .models import (
    RegistrationForm, OtherLink, Education, WorkExperience,
    ForeignLanguage, RussianFederationLanguage, SocialOrganization
)
from ldpr_form import constants
import re
import datetime


# Helper function to convert empty string to None for optional integer fields
def empty_string_to_none(value):
    return None if value == '' else value


class OtherLinkSerializer(serializers.ModelSerializer):
    """Сериализатор для модели OtherLink."""
    url = serializers.URLField(required=True, error_messages={
        'required': 'Это поле обязательно для заполнения',
        'invalid': 'Неверный формат ссылки'})

    class Meta:
        model = OtherLink
        fields = ['id', 'url']


class EducationSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Education."""
    level = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.EDUCATION_LEVELS),
        required=True,
        error_messages={'required': 'Это поле обязательно для заполнения'})
    organization = serializers.CharField(max_length=255, required=True,
                                         error_messages={
                                             'required': 'Это поле обязательно для заполнения'})

    has_postgraduate = serializers.ChoiceField(choices=constants.HAS_CHOICES,
                                               default='Нет',
                                               required=False)  # Frontend sends 'Да'/'Нет'
    postgraduate_type = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.POSTGRADUATE_TYPES),
        required=False, allow_blank=True,
        allow_null=True)  # <-- allow_blank/null
    postgraduate_organization = serializers.CharField(max_length=255,
                                                      required=False,
                                                      allow_blank=True)  # <-- allow_blank

    has_degree = serializers.ChoiceField(choices=constants.HAS_CHOICES,
                                         default='Нет', required=False)
    degree_type = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.DEGREE_TYPES),
        required=False, allow_blank=True,
        allow_null=True)  # <-- allow_blank/null

    has_title = serializers.ChoiceField(choices=constants.HAS_CHOICES,
                                        default='Нет', required=False)
    title_type = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.TITLE_TYPES),
        required=False, allow_blank=True,
        allow_null=True)  # <-- allow_blank/null

    class Meta:
        model = Education
        fields = [
            'id', 'level', 'organization', 'has_postgraduate',
            'postgraduate_type',
            'postgraduate_organization', 'has_degree', 'degree_type',
            'has_title', 'title_type'
        ]

    def validate(self, data):
        """
        Дополнительная валидация для полей образования на основе выбора 'Да'/'Нет'.
        """
        # Frontend ensures 'Нет' clears dependent fields. Backend should validate 'Да'.
        if data.get('has_postgraduate') == 'Да':
            if not data.get('postgraduate_type'):
                raise serializers.ValidationError(
                    {"postgraduateType": "Выберите вид образования."})
            if not data.get('postgraduate_organization'):
                raise serializers.ValidationError({
                                                      "postgraduateOrganization": "Это поле обязательно для заполнения."})

        if data.get('has_degree') == 'Да' and not data.get('degree_type'):
            raise serializers.ValidationError(
                {"degreeType": "Выберите ученую степень."})

        if data.get('has_title') == 'Да' and not data.get('title_type'):
            raise serializers.ValidationError(
                {"titleType": "Выберите ученое звание."})

        return data


class WorkExperienceSerializer(serializers.ModelSerializer):
    """Сериализатор для модели WorkExperience."""
    organization = serializers.CharField(max_length=255, required=True,
                                         error_messages={
                                             'required': 'Это поле обязательно для заполнения'})
    position = serializers.CharField(max_length=255, required=True,
                                     error_messages={
                                         'required': 'Это поле обязательно для заполнения'})
    start_date = serializers.CharField(max_length=50, required=True,
                                       error_messages={
                                           'required': 'Это поле обязательно для заполнения',
                                           'invalid': 'Неверный формат даты. Ожидается ММ.ГГГГ'})  # Frontend uses string "01.2020"

    class Meta:
        model = WorkExperience
        fields = ['id', 'organization', 'position', 'start_date']


class ForeignLanguageSerializer(serializers.ModelSerializer):
    """Сериализатор для модели ForeignLanguage."""
    name = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.FOREIGN_LANGUAGES),
        required=True,
        error_messages={'required': 'Это поле обязательно для заполнения'})
    level = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.LANGUAGE_LEVELS),
        required=False,
        default='Читаю и перевожу со словарем')  # Default value on frontend

    class Meta:
        model = ForeignLanguage
        fields = ['id', 'name', 'level']


class RussianFederationLanguageSerializer(serializers.ModelSerializer):
    """Сериализатор для модели RussianFederationLanguage."""
    name = serializers.ChoiceField(choices=constants.make_choices_from_list(
        constants.RUSSIAN_FEDERATION_LANGUAGES), required=True, error_messages={
        'required': 'Это поле обязательно для заполнения'})
    level = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.LANGUAGE_LEVELS),
        required=False, default='Читаю и перевожу со словарем')

    class Meta:
        model = RussianFederationLanguage
        fields = ['id', 'name', 'level']


class SocialOrganizationSerializer(serializers.ModelSerializer):
    """Сериализатор для модели SocialOrganization."""
    name = serializers.CharField(max_length=255, required=True, error_messages={
        'required': 'Это поле обязательно для заполнения'})
    position = serializers.CharField(max_length=255, required=True,
                                     error_messages={
                                         'required': 'Это поле обязательно для заполнения'})
    years = serializers.CharField(max_length=50, required=True, error_messages={
        'required': 'Это поле обязательно для заполнения',
        'invalid': 'Неверный формат годов. Ожидается ГГГГ-ГГГГ'})  # Frontend uses string "2018-2022"

    class Meta:
        model = SocialOrganization
        fields = ['id', 'name', 'position', 'years']


class RegistrationFormSerializer(serializers.ModelSerializer):
    """
    Основной сериализатор для модели RegistrationForm, включающий вложенные сериализаторы
    для связанных данных.
    """
    # Nested serializers for related objects
    other_links = OtherLinkSerializer(many=True,
                                      required=False)  # Frontend allows 0 links
    education = EducationSerializer(many=True,
                                    required=True)  # Frontend requires at least one
    work_experience = WorkExperienceSerializer(many=True,
                                               required=True)  # Frontend requires at least one
    foreign_languages = ForeignLanguageSerializer(many=True, required=False)
    russian_federation_languages = RussianFederationLanguageSerializer(
        many=True, required=False)
    social_organizations = SocialOrganizationSerializer(many=True,
                                                        required=False)

    # Main fields (camelCase from frontend will be converted to snake_case by drf_camel_case)
    # Explicitly define fields with custom requirements/validation
    telegram_id = serializers.CharField(max_length=255, required=False,
                                        allow_blank=True, allow_null=True)
    middle_name = serializers.CharField(max_length=255, required=False,
                                        allow_blank=True)

    phone = serializers.CharField(max_length=20, required=True, error_messages={
        'required': 'Это поле обязательно для заполнения'})
    email = serializers.EmailField(required=True, error_messages={
        'required': 'Это поле обязательно для заполнения',
        'invalid': 'Введите корректный адрес электронной почты'})
    vk_page = serializers.URLField(required=True, error_messages={
        'required': 'Это поле обязательно для заполнения',
        'invalid': 'Неверный формат ссылки'})
    vk_group = serializers.URLField(required=False, allow_blank=True)
    telegram_channel = serializers.URLField(required=False, allow_blank=True)
    personal_site = serializers.URLField(required=False, allow_blank=True)

    # Family fields - handle empty strings from frontend becoming None for OptionalIntegerField
    children_count = serializers.IntegerField(allow_null=True,
                                              min_value=0, default=0,
                                              help_text="Количество детей")  # Default 0 from frontend
    children_male_count = serializers.IntegerField(required=False,
                                                   allow_null=True, min_value=0)
    children_female_count = serializers.IntegerField(required=False,
                                                     allow_null=True,
                                                     min_value=0)
    underage_children_count = serializers.IntegerField(required=False,
                                                       allow_null=True,
                                                       min_value=0)
    underage_children_male_count = serializers.IntegerField(required=False,
                                                            allow_null=True,
                                                            min_value=0)
    underage_children_female_count = serializers.IntegerField(required=False,
                                                              allow_null=True,
                                                              min_value=0)

    # Professional sphere (from JSONField in model)
    professional_sphere = serializers.JSONField(required=True, error_messages={
        'required': 'Это поле обязательно для заполнения'})
    awards = serializers.CharField(required=False, allow_blank=True)

    # Feedback fields
    ldpr_resources = serializers.JSONField(required=False,
                                           default=list)  # Frontend sends list, can be empty
    central_office_assistant = serializers.CharField(required=False,
                                                     allow_blank=True)
    knowledge_gaps = serializers.JSONField(required=False, default=list)

    # Additional info fields (required by frontend)
    additional_info = serializers.CharField(required=True, allow_blank=False,
                                            error_messages={
                                                'required': 'Это поле обязательно для заполнения',
                                                'blank': 'Это поле не может быть пустым'})
    suggestions = serializers.CharField(required=True, allow_blank=False,
                                        error_messages={
                                            'required': 'Это поле обязательно для заполнения',
                                            'blank': 'Это поле не может быть пустым'})
    talents = serializers.CharField(required=True, allow_blank=False,
                                    error_messages={
                                        'required': 'Это поле обязательно для заполнения',
                                        'blank': 'Это поле не может быть пустым'})
    knowledge_to_share = serializers.CharField(required=True, allow_blank=False,
                                               error_messages={
                                                   'required': 'Это поле обязательно для заполнения',
                                                   'blank': 'Это поле не может быть пустым'})
    superpower = serializers.CharField(required=True, allow_blank=False,
                                       error_messages={
                                           'required': 'Это поле обязательно для заполнения',
                                           'blank': 'Это поле не может быть пустым'})

    class Meta:
        model = RegistrationForm
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    # --- Field-level validators ---
    def validate_phone(self, value):
        """
        Валидация номера телефона (пример: формат +7XXXXXXXXXX).
        """
        if not re.match(r'^\+7\d{10}$', value):
            raise serializers.ValidationError(
                "Неверный формат телефона. Ожидается +7XXXXXXXXXX.")
        return value

    def validate_birth_date(self, value):
        """
        Валидация даты рождения: возраст должен быть не менее 18 лет.
        """
        if not value:
            raise serializers.ValidationError("Дата рождения обязательна.")
        today = datetime.date.today()
        age = today.year - value.year - (
                    (today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError(
                "Возраст должен быть не менее 18 лет.")
        return value

    def validate_party_experience(self, value):
        if value is None:  # Can be None if frontend sends empty string and serializer converts
            raise serializers.ValidationError("Стаж в партии обязателен.")
        if value < 0:
            raise serializers.ValidationError(
                "Стаж не может быть отрицательным.")
        return value

    def validate_professional_sphere(self, value):
        """
        Валидация профессиональной сферы: должно быть выбрано ровно 4 варианта.
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("Это поле должно быть списком.")
        if len(value) != 4:
            raise serializers.ValidationError(
                f"Выберите ровно 4 варианта. Выбрано: {len(value)}")
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError(
                    "Все элементы списка должны быть строками.")
        return value

    # --- Object-level validator ---
    def validate(self, data):
        """
        Общая валидация данных формы.
        """
        # Валидация семейного положения в зависимости от пола (соответствует логике React)
        gender = data.get('gender')
        marital_status = data.get('marital_status')
        if gender == 'Мужчина' and marital_status not in [choice[0] for choice
                                                          in
                                                          constants.MARITAL_STATUS_MALE]:
            raise serializers.ValidationError(
                {"maritalStatus": "Неверное семейное положение для мужчины."})
        if gender == 'Женщина' and marital_status not in [choice[0] for choice
                                                          in
                                                          constants.MARITAL_STATUS_FEMALE]:
            raise serializers.ValidationError(
                {"maritalStatus": "Неверное семейное положение для женщины."})

        # Валидация количества детей (соответствует логике React)
        children_count = data.get('children_count')
        children_male_count = data.get('children_male_count')
        children_female_count = data.get('children_female_count')

        if children_count is not None and children_count > 0:
            if children_male_count is None:
                raise serializers.ValidationError({
                                                      "childrenMaleCount": "Это поле обязательно для заполнения, если есть дети."})
            if children_female_count is None:
                raise serializers.ValidationError({
                                                      "childrenFemaleCount": "Это поле обязательно для заполнения, если есть дети."})
            if children_male_count + children_female_count != children_count:
                raise serializers.ValidationError({
                    "childrenMaleCount": "Сумма мальчиков и девочек не соответствует общему количеству детей.",
                    "childrenFemaleCount": "Сумма мальчиков и девочек не соответствует общему количеству детей."
                })
        elif children_count == 0:  # If children_count is explicitly 0, ensure male/female counts are 0 or None
            if children_male_count is not None and children_male_count > 0:
                raise serializers.ValidationError({
                                                      "childrenMaleCount": "Не может быть мальчиков, если нет детей."})
            if children_female_count is not None and children_female_count > 0:
                raise serializers.ValidationError({
                                                      "childrenFemaleCount": "Не может быть девочек, если нет детей."})

        # Валидация количества несовершеннолетних детей (соответствует логике React)
        underage_children_count = data.get('underage_children_count')
        underage_children_male_count = data.get('underage_children_male_count')
        underage_children_female_count = data.get(
            'underage_children_female_count')

        if underage_children_count is not None and underage_children_count > 0:
            if underage_children_male_count is None:
                raise serializers.ValidationError({
                                                      "underageChildrenMaleCount": "Это поле обязательно для заполнения, если есть несовершеннолетние дети."})
            if underage_children_female_count is None:
                raise serializers.ValidationError({
                                                      "underageChildrenFemaleCount": "Это поле обязательно для заполнения, если есть несовершеннолетние дети."})
            if underage_children_male_count + underage_children_female_count != underage_children_count:
                raise serializers.ValidationError({
                    "underageChildrenMaleCount": "Сумма несовершеннолетних мальчиков и девочек не соответствует общему количеству несовершеннолетних детей.",
                    "underageChildrenFemaleCount": "Сумма несовершеннолетних мальчиков и девочек не соответствует общему количеству несовершеннолетних детей."
                })
        elif underage_children_count == 0:  # If underage_children_count is explicitly 0
            if underage_children_male_count is not None and underage_children_male_count > 0:
                raise serializers.ValidationError({
                                                      "underageChildrenMaleCount": "Не может быть несовершеннолетних мальчиков, если нет несовершеннолетних детей."})
            if underage_children_female_count is not None and underage_children_female_count > 0:
                raise serializers.ValidationError({
                                                      "underageChildrenFemaleCount": "Не может быть несовершеннолетних девочек, если нет несовершеннолетних детей."})

        if children_count is not None and underage_children_count is not None and underage_children_count > children_count:
            raise serializers.ValidationError({
                                                  "underageChildrenCount": "Количество несовершеннолетних детей не может превышать общее количество детей."})

        # Валидация, если разделы "Образование", "Языки" или "Работа" пусты
        # React's `isStepComplete` checks for `length === 0`
        if not data.get('education') or len(data['education']) == 0:
            raise serializers.ValidationError({
                                                  "education": "Пожалуйста, добавьте информацию о вашем образовании."})

        # Combined language validation
        foreign_langs = data.get('foreign_languages')
        rf_langs = data.get('russian_federation_languages')
        if (not foreign_langs or len(foreign_langs) == 0) and \
                (not rf_langs or len(rf_langs) == 0):
            raise serializers.ValidationError({
                                                  "languages": "Пожалуйста, добавьте хотя бы один язык, которым вы владеете."})

        if not data.get('work_experience') or len(data['work_experience']) == 0:
            raise serializers.ValidationError({
                                                  "workExperience": "Пожалуйста, добавьте хотя бы одно место работы."})

        return data

    def create(self, validated_data):
        """
        Создание RegistrationForm и связанных объектов.
        """
        # Извлекаем вложенные данные
        other_links_data = validated_data.pop('other_links', [])
        education_data = validated_data.pop('education', [])
        work_experience_data = validated_data.pop('work_experience', [])
        foreign_languages_data = validated_data.pop('foreign_languages', [])
        russian_federation_languages_data = validated_data.pop(
            'russian_federation_languages', [])
        social_organizations_data = validated_data.pop('social_organizations',
                                                       [])

        # Создаем основную форму
        registration_form = RegistrationForm.objects.create(**validated_data)

        # Создаем связанные объекты
        for link_data in other_links_data:
            OtherLink.objects.create(form=registration_form, **link_data)
        for edu_data in education_data:
            Education.objects.create(form=registration_form, **edu_data)
        for work_data in work_experience_data:
            WorkExperience.objects.create(form=registration_form, **work_data)
        for lang_data in foreign_languages_data:
            ForeignLanguage.objects.create(form=registration_form, **lang_data)
        for lang_data in russian_federation_languages_data:
            RussianFederationLanguage.objects.create(form=registration_form,
                                                     **lang_data)
        for org_data in social_organizations_data:
            SocialOrganization.objects.create(form=registration_form,
                                              **org_data)

        return registration_form

    def update(self, instance, validated_data):
        """
        Обновление RegistrationForm и связанных объектов.
        """
        # Обновляем вложенные данные (удаляем старые, создаем новые)
        self._update_related_objects(instance, validated_data, 'other_links',
                                     OtherLinkSerializer, 'other_links')
        self._update_related_objects(instance, validated_data, 'education',
                                     EducationSerializer, 'education')
        self._update_related_objects(instance, validated_data,
                                     'work_experience',
                                     WorkExperienceSerializer,
                                     'work_experience')
        self._update_related_objects(instance, validated_data,
                                     'foreign_languages',
                                     ForeignLanguageSerializer,
                                     'foreign_languages')
        self._update_related_objects(instance, validated_data,
                                     'russian_federation_languages',
                                     RussianFederationLanguageSerializer,
                                     'russian_federation_languages')
        self._update_related_objects(instance, validated_data,
                                     'social_organizations',
                                     SocialOrganizationSerializer,
                                     'social_organizations')

        # Обновляем поля основной RegistrationForm
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def _update_related_objects(self, instance, validated_data, field_name,
                                serializer_class, related_name):
        """
        Вспомогательный метод для обновления связанных объектов.
        """
        data = validated_data.pop(field_name, None)
        if data is not None:
            # Delete only if data is actually provided. If data is an empty list, it means clear them.
            # If data is None, it means the field was not sent, so don't touch existing.
            getattr(instance, related_name).all().delete()
            for item_data in data:
                serializer_class.Meta.model.objects.create(form=instance,
                                                           **item_data)