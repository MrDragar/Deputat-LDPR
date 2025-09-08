from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from ldpr_form.views import RegistrationFormViewSet, ProcessFormViewSet

router = DefaultRouter()
router.register('registration-forms', RegistrationFormViewSet, "RegistrationForm")
router.register(r'', ProcessFormViewSet, basename='process-form')
# router.register('registration-forms/list', RegistrationFormListView.as_view(), "RegistrationForm")
# router.register('registration-forms/list/<int:pk>',
#                 RegistrationFormDetailView.as_view(), "RegistrationForm")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls))
]

from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()
