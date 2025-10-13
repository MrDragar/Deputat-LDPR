from django.contrib import admin
from users.models import (
    RegistrationForm, OtherLink, Education, WorkExperience,
    ForeignLanguage, RussianFederationLanguage, SocialOrganization, User
)


class OtherLinkInline(
    admin.TabularInline):  # TabularInline для компактного отображения таблицы
    model = OtherLink
    extra = 1  # Количество пустых форм для добавления новых ссылок по умолчанию
    fields = ['url']


class EducationInline(
    admin.StackedInline):  # StackedInline для более полного отображения каждой формы
    model = Education
    extra = 1
    fieldsets = (
        (None, {
            'fields': (
                ('level', 'organization'),
                ('has_postgraduate', 'postgraduate_type',
                 'postgraduate_organization'),  # Группировка в админке
                ('has_degree', 'degree_type'),
                ('has_title', 'title_type'),
            )
        }),
    )


class WorkExperienceInline(admin.StackedInline):
    model = WorkExperience
    extra = 1
    fields = ['organization', 'position', 'start_date']


class ForeignLanguageInline(admin.TabularInline):
    model = ForeignLanguage
    extra = 1
    fields = ['name', 'level']


class RussianFederationLanguageInline(admin.TabularInline):
    model = RussianFederationLanguage
    extra = 1
    fields = ['name', 'level']


class SocialOrganizationInline(admin.StackedInline):
    model = SocialOrganization
    extra = 1
    fields = ['name', 'position', 'years']


# ====================================================================
# Административный класс для основной модели RegistrationForm
# ====================================================================

# @admin.register(RegistrationForm)
class RegistrationFormAdmin(admin.StackedInline):
    model = RegistrationForm
    # Поля, отображаемые в списке объектов на странице админки
    list_display = (
        'last_name', 'first_name', 'middle_name', 'gender', 'birth_date',
        'region', 'created_at'
    )
    # Поля, по которым можно производить поиск
    search_fields = (
        'last_name', 'first_name', 'middle_name', 'phone',
        'email',
        'region', 'party_position', 'representative_body_name'
    )
    # Поля для фильтрации в сайдбаре
    list_filter = (
        'gender', 'region', 'marital_status', 'party_role',
        'representative_body_level',
        'committee_status', 'created_at'
    )
    # Поля, которые можно редактировать прямо в списке (list_display)
    list_editable = ()  # Обычно не используется для таких форм, но возможно

    # Группировка полей на странице редактирования объекта
    fieldsets = (
        ('Основная информация', {
            'fields': (
                ('last_name', 'first_name', 'middle_name'),
                ('gender', 'birth_date', 'region'),
            ),
            'description': 'Основная личная информация о депутате.'
        }),
        ('Контактная информация', {
            'fields': (
                ('phone', 'email'),
                ('vk_page', 'vk_group'),
                ('telegram_channel', 'personal_site'),
            ),
            'description': 'Способы связи с депутатом и его онлайн-присутствие.'
        }),
        ('Семья', {
            'fields': (
                'marital_status',
                ('children_count', 'children_male_count',
                 'children_female_count'),
                ('underage_children_count', 'underage_children_male_count',
                 'underage_children_female_count'),
            ),
            'description': 'Информация о семейном положении и детях.'
        }),
        ('Партийная деятельность', {
            'fields': (
                'party_experience',
                'party_position',
                'party_role',
            ),
            'description': 'Деятельность в рамках партии ЛДПР.'
        }),
        ('Общественная деятельность', {
            'fields': (
                ('representative_body_name', 'representative_body_level'),
                ('representative_body_position', 'committee_name',
                 'committee_status'),
            ),
            'description': 'Участие в представительных и общественных органах.'
        }),
        ('Профессиональная деятельность', {
            'fields': (
                'professional_sphere',
                'awards',
            ),
            'description': 'Сфера профессиональной деятельности и награды.'
        }),
        ('Увлечения и интересы', {
            'fields': (
                'sports',
                'recreation',
                'hobbies',
            ),
            'description': 'Информация о хобби и интересах.'
        }),
        ('Обратная связь', {
            'fields': (
                'ldpr_resources',
                'central_office_assistant',
                'knowledge_gaps',
            ),
            'description': 'Сбор информации для улучшения работы.'
        }),
        ('Дополнительная информация', {
            'fields': (
                'additional_info',
                'suggestions',
                'talents',
                'knowledge_to_share',
                'superpower',
            ),
            'description': 'Прочая информация, предоставленная депутатом.'
        }),
    )

    # Включение Inline-классов для связанных моделей
    inlines = [
        OtherLinkInline,
        EducationInline,
        WorkExperienceInline,
        ForeignLanguageInline,
        RussianFederationLanguageInline,
        SocialOrganizationInline,
    ]

    # Поля, доступные только для чтения
    readonly_fields = ('created_at', 'updated_at')

    # Опционально: Кастомизация админки
    # def get_queryset(self, request):
    #     queryset = super().get_queryset(request)
    #     # Оптимизация запросов для Inline моделей
    #     return queryset.prefetch_related(
    #         'other_links', 'education', 'work_experience',
    #         'foreign_languages', 'russian_federation_languages', 'social_organizations'
    #     )


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        'user_id', 'login', 'role', 'is_active', 'date_joined',
        'last_login', 'is_staff'
    )
    search_fields = ('user_id', 'login', 'role', "is_active")

    list_filter = ('role', 'is_active', 'date_joined', 'last_login')

    fieldsets = (
        (None, {
            'fields': ('user_id', 'login', 'password')
        }),
        ('Права доступа', {
            'fields': ('role', 'is_active')
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'user_id', 'login', 'password1', 'password2', 'role',
                'is_active'),
        }),
    )
    readonly_fields = ('date_joined', 'last_login')
    ordering = ('user_id',)
    inlines = [RegistrationFormAdmin]

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"

    def get_inlines(self, request, obj=None):
        """
        Показывать RegistrationFormInline только если у пользователя уже есть анкета
        или если мы создаем нового пользователя (obj is None)
        """
        if obj is None:
            return [RegistrationFormAdmin]

        try:
            if hasattr(obj, 'deputy_form'):
                return [RegistrationFormAdmin]
        except RegistrationForm.DoesNotExist:
            pass

        # Если анкеты нет, не показываем inline
        return []

# Если вы используете @admin.register, вам не нужно вызывать admin.site.register() отдельно.
# Для всех остальных моделей, которые не имеют Inlines:
# admin.site.register(OtherLink)
# admin.site.register(Education)
# admin.site.register(WorkExperience)
# admin.site.register(ForeignLanguage)
# admin.site.register(RussianFederationLanguage)
# admin.site.register(SocialOrganization)
# admin.site.register(UserAdmin)
