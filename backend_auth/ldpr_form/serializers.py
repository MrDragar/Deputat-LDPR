from rest_framework import serializers
from users.models import (
    RegistrationForm, OtherLink, Education, WorkExperience,
    ForeignLanguage, RussianFederationLanguage, SocialOrganization, User
)
from ldpr_form import constants


def empty_string_to_none(value):
    return None if value == '' else value


class UserCreationSerializer(serializers.Serializer):
    telegram_id = serializers.CharField(max_length=255, required=True)

    def create(self, validation_data):
        try:
            user = User.objects.get(user_id=validation_data["telegram_id"])
        except User.DoesNotExist:
            user = User.objects.create(user_id=validation_data["telegram_id"])
        if user.is_active:
            raise serializers.ValidationError("User is already active")
        return user


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
                                               default='Нет', required=False)
    postgraduate_type = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.POSTGRADUATE_TYPES),
        required=False, allow_blank=True, allow_null=True)
    postgraduate_organization = serializers.CharField(max_length=255,
                                                      required=False,
                                                      allow_blank=True)

    has_degree = serializers.ChoiceField(choices=constants.HAS_CHOICES,
                                         default='Нет', required=False)
    degree_type = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.DEGREE_TYPES),
        required=False, allow_blank=True, allow_null=True)

    has_title = serializers.ChoiceField(choices=constants.HAS_CHOICES,
                                        default='Нет', required=False)
    title_type = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.TITLE_TYPES),
        required=False, allow_blank=True, allow_null=True)

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
                                           'invalid': 'Неверный формат даты. Ожидается ММ.ГГГГ'})

    class Meta:
        model = WorkExperience
        fields = ['id', 'organization', 'position', 'start_date']


class ForeignLanguageSerializer(serializers.ModelSerializer):
    """Сериализатор для модели ForeignLanguage."""
    name = serializers.CharField(
        max_length=100,
        required=True,
        error_messages={'required': 'Это поле обязательно для заполнения'})
    level = serializers.ChoiceField(
        choices=constants.make_choices_from_list(constants.LANGUAGE_LEVELS),
        required=False, default='Читаю и перевожу со словарем')

    class Meta:
        model = ForeignLanguage
        fields = ['id', 'name', 'level']


class RussianFederationLanguageSerializer(serializers.ModelSerializer):
    """Сериализатор для модели RussianFederationLanguage."""
    name = serializers.CharField(max_length=100, required=True, error_messages={
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
        'invalid': 'Неверный формат годов. Ожидается ГГГГ-ГГГГ'})

    class Meta:
        model = SocialOrganization
        fields = ['id', 'name', 'position', 'years']


class RegistrationFormSerializer(serializers.ModelSerializer):
    """
    Основной сериализатор для модели RegistrationForm, включающий вложенные сериализаторы
    для связанных данных.
    """
    other_links = OtherLinkSerializer(many=True, required=False)
    education = EducationSerializer(many=True, required=True)
    work_experience = WorkExperienceSerializer(many=True, required=False)
    foreign_languages = ForeignLanguageSerializer(many=True, required=False)
    russian_federation_languages = RussianFederationLanguageSerializer(
        many=True, required=False)
    social_organizations = SocialOrganizationSerializer(many=True,
                                                        required=False)

    birth_date = serializers.DateField(
        input_formats=['%d.%m.%Y', '%Y-%m-%d'],
        required=True,
        error_messages={
            'required': 'Дата рождения обязательна для заполнения.',
            'invalid': 'Неверный формат даты. Используйте ДД.ММ.ГГГГ.'
        }
    )
    telegram_id = serializers.CharField(max_length=255, required=True, write_only=True)

    class Meta:
        model = RegistrationForm
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'user']
        extra_kwargs = {
            'telegram_id': {'read_only': True}
        }

    def validate_children_count(self, value):
        return 0 if value == "" else value

    def validate_children_male_count(self, value):
        return 0 if value == "" else value

    def validate_children_female_count(self, value):
        return 0 if value == "" else value

    def validate_underage_children_count(self, value):
        return 0 if value == "" else value

    def validate_underage_children_male_count(self, value):
        return 0 if value == "" else value

    def validate_underage_children_female_count(self, value):
        return 0 if value == "" else value

    def create(self, validated_data):
        try:
            user = User.objects.get(user_id=validated_data.pop("telegram_id"))
        except User.DoesNotExist:
            raise serializers.ValidationError({'telegram_id': 'User with this telegram_id does not exist'})
        if hasattr(user, 'deputy_form') and user.deputy_form:
            user.deputy_form.delete()

        other_links_data = validated_data.pop('other_links', [])
        education_data = validated_data.pop('education', [])
        work_experience_data = validated_data.pop('work_experience', [])
        foreign_languages_data = validated_data.pop('foreign_languages', [])
        russian_federation_languages_data = validated_data.pop(
            'russian_federation_languages', [])
        social_organizations_data = validated_data.pop('social_organizations',
                                                       [])
        registration_form = RegistrationForm.objects.create(user=user,
                                                            **validated_data)

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

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def _update_related_objects(self, instance, validated_data, field_name,
                                serializer_class, related_name):
        data = validated_data.pop(field_name, None)
        if data is not None:
            getattr(instance, related_name).all().delete()
            for item_data in data:
                serializer_class.Meta.model.objects.create(form=instance,
                                                           **item_data)


class ProcessFormSerializer(serializers.Serializer):
    status = serializers.BooleanField()
    message = serializers.CharField(required=False, allow_blank=True)
    user_id = serializers.IntegerField()
