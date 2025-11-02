# views.py
from rest_framework import viewsets
from .models import ReportPeriod, Report, RegionReport, DeputyRecord, \
    ReportRecord
from .serializers import (
    ReportPeriodSerializer,
    ReportSerializer,
    RegionReportSerializer,
    DeputyRecordSerializer,
    ReportRecordSerializer
)


class ReportPeriodViewSet(viewsets.ModelViewSet):
    queryset = ReportPeriod.objects.all()
    serializer_class = ReportPeriodSerializer


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer


class RegionReportViewSet(viewsets.ModelViewSet):
    queryset = RegionReport.objects.all()
    serializer_class = RegionReportSerializer


class DeputyRecordViewSet(viewsets.ModelViewSet):
    queryset = DeputyRecord.objects.all()
    serializer_class = DeputyRecordSerializer


class ReportRecordViewSet(viewsets.ModelViewSet):
    queryset = ReportRecord.objects.all()
    serializer_class = ReportRecordSerializer
