from django.http import FileResponse
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action

from ldpr_form.permissions import IsAdmin, IsAuthenticated
from .auto_form_table2 import generate_excel_bytes
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

from .services import init_report_period, init_report, init_deputy_record, \
    build_excel_data_for_region


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

    @action(detail=True, methods=['get'], permission_classes=[IsAdmin])
    def download_excel(self, request, pk=None):
        """
        Эндпоинт для скачивания сгенерированного Excel-отчета по региону.
        Доступен по GET api/auth/mouth_reports/region_reports/{id}/download_excel/
        """
        region_report = self.get_object()

        # 1. Собираем данные в формате JSON-словаря
        data = build_excel_data_for_region(region_report)

        # 2. Генерируем Excel в оперативной памяти
        # Можно передать заголовки info_titles и vdpg_titles, если необходимо
        excel_buffer = generate_excel_bytes(data)

        # 3. Формируем безопасное имя файла
        safe_region_name = region_report.region_name.replace(" ", "_")
        filename = f"Report_{safe_region_name}.xlsx"

        # 4. Возвращаем как файл
        return FileResponse(
            excel_buffer,
            as_attachment=True,
            filename=filename,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )


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
        if self.action == 'retrieve' or self.action == "partial_update" or self.action == "update":
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
