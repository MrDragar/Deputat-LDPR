from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'report-periods', views.ReportPeriodViewSet)
router.register(r'reports', views.ReportViewSet)
router.register(r'region-reports', views.RegionReportViewSet)
router.register(r'deputy-records', views.DeputyRecordViewSet)
router.register(r'report-records', views.ReportRecordViewSet)

# urlpatterns = [
#     path('api/', include(router.urls)),
# ]