from rest_framework import serializers
from users.models import User, RegistrationForm, Education, WorkExperience, \
    ForeignLanguage, RussianFederationLanguage, SocialOrganization, OtherLink


class OtherLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = OtherLink
        fields = ['url']


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'


class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = '__all__'


class ForeignLanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForeignLanguage
        fields = '__all__'


class RussianFederationLanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RussianFederationLanguage
        fields = '__all__'


class SocialOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialOrganization
        fields = '__all__'


class RegistrationFormSerializer(serializers.ModelSerializer):
    education = EducationSerializer(many=True, read_only=True)
    work_experience = WorkExperienceSerializer(many=True, read_only=True)
    foreign_languages = ForeignLanguageSerializer(many=True, read_only=True)
    russian_federation_languages = RussianFederationLanguageSerializer(
        many=True, read_only=True)
    social_organizations = SocialOrganizationSerializer(many=True,
                                                        read_only=True)
    other_links = OtherLinkSerializer(many=True, read_only=True)

    class Meta:
        model = RegistrationForm
        fields = '__all__'
        depth = 1


class UserSerializer(serializers.ModelSerializer):
    deputy_form = RegistrationFormSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'user_id',
            'login',
            'is_active',
            'role',
            'date_joined',
            'last_login',
            'deputy_form'
        ]


class ShortRegistrationFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistrationForm
        fields = '__all__'


class UserListSerializer(serializers.ModelSerializer):
    deputy_form = ShortRegistrationFormSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'user_id',
            'login',
            'is_active',
            'role',
            'date_joined',
            'last_login',
            'deputy_form'
        ]
        depth = 1
