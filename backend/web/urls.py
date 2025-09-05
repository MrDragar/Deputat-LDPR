from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from ldpr_form.views import RegistrationFormCreateView

# from ldpr_form.views import RegistrationFormViewSet

router = DefaultRouter()
# router.register(r'registration-forms', RegistrationFormViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/registration-forms/', RegistrationFormCreateView.as_view(),
         name='registrationform-create'),
]
