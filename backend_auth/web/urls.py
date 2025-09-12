from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenVerifyView, TokenRefreshView, \
    TokenObtainPairView

from ldpr_form.views import RegistrationFormViewSet, ProcessFormViewSet

router = DefaultRouter()
router.register('registration-forms', RegistrationFormViewSet, "RegistrationForm")
router.register(r'', ProcessFormViewSet,'process-form')

urlpatterns = [
    path('api/auth/admin/', admin.site.urls),
    path('api/auth/', include(router.urls)),
    path('api/auth/', include([
        path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('verify/', TokenVerifyView.as_view(), name='token_verify'),
    ])),
]

from django.contrib.staticfiles.urls import staticfiles_urlpatterns

urlpatterns += staticfiles_urlpatterns()
