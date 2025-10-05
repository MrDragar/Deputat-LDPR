from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from ldpr_form.views import RegistrationFormViewSet, ProcessFormViewSet

router = DefaultRouter()
router.register('registration-forms', RegistrationFormViewSet, "RegistrationForm")
router.register(r'', ProcessFormViewSet,'process-form')

urlpatterns = [
    path('api/auth/admin/', admin.site.urls),
    path('api/auth/', include(router.urls)),
    path('api/auth/', include("jwt_auth.urls")),
]

from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()
