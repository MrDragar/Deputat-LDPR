from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action

from ldpr_form.permissions import IsAdmin, IsAuthenticated
from .models import ReportPeriod, Report, RegionReport, DeputyRecord, \
    ReportRecord
from .serializers import (
    # List serializers
    ReportPeriodListSerializer,
    ReportListSerializer,
    RegionReportListSerializer,
    DeputyRecordListSerializer,
    ReportRecordListSerializer,
    # Detail serializers
    ReportPeriodDetailSerializer,
    ReportDetailSerializer,
    RegionReportDetailSerializer,
    DeputyRecordDetailSerializer,
    ReportRecordDetailSerializer, AdminReportRecordSerializer,
)

from .services import init_report_period, init_report, init_deputy_record


class ReportPeriodViewSet(viewsets.ModelViewSet):
    queryset = ReportPeriod.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ReportPeriodDetailSerializer
        return ReportPeriodListSerializer

    def get_queryset(self):
        if self.action == 'retrieve':
            # Предзагружаем связанные объекты для оптимизации
            return ReportPeriod.objects.prefetch_related(
                'reports',
                'region_reports'
            )
        return ReportPeriod.objects.all()

    def perform_create(self, serializer):
        instance: ReportPeriod = serializer.save()
        init_report_period(instance)


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            # Ваш ReportDetailSerializer не имеет вложенных объектов
            return ReportDetailSerializer
        return ReportListSerializer

    def get_queryset(self):
        if self.action == 'retrieve':
            return Report.objects.select_related('report_period')
        return Report.objects.all()

    def perform_create(self, serializer):
        instance: Report = serializer.save()
        init_report(instance)


class RegionReportViewSet(viewsets.ModelViewSet):
    queryset = RegionReport.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RegionReportDetailSerializer
        return RegionReportListSerializer

    def get_queryset(self):
        if self.action == 'retrieve':
            # Предзагружаем deputies_records для оптимизации
            return RegionReport.objects.prefetch_related(
                'deputies_records'
            ).select_related('report_period')
        return RegionReport.objects.all()


class DeputyRecordViewSet(viewsets.ModelViewSet):
    queryset = DeputyRecord.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DeputyRecordDetailSerializer
        return DeputyRecordListSerializer

    def get_queryset(self):
        if self.action == 'retrieve':
            # Предзагружаем report_records и связанные объекты
            return DeputyRecord.objects.prefetch_related(
                'report_records'
            ).select_related('region_report', 'deputy')
        return DeputyRecord.objects.all()

    def perform_create(self, serializer):
        instance: DeputyRecord = serializer.save()
        init_deputy_record(instance)


class ReportRecordViewSet(viewsets.ModelViewSet):
    queryset = ReportRecord.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ReportRecordDetailSerializer
        if self.action == 'admin_check':
            return AdminReportRecordSerializer
        return ReportRecordListSerializer

    def get_queryset(self):
        if self.action == 'retrieve':
            # Загружаем связанные объекты
            return ReportRecord.objects.select_related(
                'deputy_record',
                'report'
            )
        return ReportRecord.objects.all()

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def admin_check(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
