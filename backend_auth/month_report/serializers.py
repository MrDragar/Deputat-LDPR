from rest_framework import serializers
from .models import ReportPeriod, Report, RegionReport, DeputyRecord, \
    ReportRecord


# Базовые сериализаторы для списков
class ReportRecordListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportRecord
        fields = '__all__'


class DeputyRecordListSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display',
                                          read_only=True)

    class Meta:
        model = DeputyRecord
        fields = '__all__'


class RegionReportListSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionReport
        fields = '__all__'


class ReportListSerializer(serializers.ModelSerializer):
    theme_display = serializers.CharField(source='get_theme_display',
                                          read_only=True)

    class Meta:
        model = Report
        fields = '__all__'


class ReportPeriodListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportPeriod
        fields = '__all__'


# Детальные сериализаторы с вложенными объектами
class ReportRecordDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportRecord
        fields = '__all__'


class DeputyRecordDetailSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display',
                                          read_only=True)
    report_records = ReportRecordListSerializer(many=True, read_only=True)

    class Meta:
        model = DeputyRecord
        fields = '__all__'


class RegionReportDetailSerializer(serializers.ModelSerializer):
    deputies_records = DeputyRecordListSerializer(many=True, read_only=True)

    class Meta:
        model = RegionReport
        fields = '__all__'


class ReportDetailSerializer(serializers.ModelSerializer):
    theme_display = serializers.CharField(source='get_theme_display',
                                          read_only=True)

    class Meta:
        model = Report
        fields = '__all__'


class ReportPeriodDetailSerializer(serializers.ModelSerializer):
    reports = ReportListSerializer(many=True, read_only=True)
    region_reports = RegionReportListSerializer(many=True, read_only=True)

    class Meta:
        model = ReportPeriod
        fields = '__all__'
