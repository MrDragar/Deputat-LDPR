from django.utils import timezone
from rest_framework import serializers
from .models import ReportPeriod, Report, RegionReport, DeputyRecord, \
    ReportRecord


# Базовые сериализаторы для списков
class ReportRecordListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportRecord
        fields = '__all__'
        read_only_fields = [
            'score',
            'score_explanation',
            'status',
            'checked_at',
            'created_at'
        ]


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
        read_only_fields = [
            'score',
            'score_explanation',
            'status',
            'checked_at',
            'created_at'
        ]


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


class AdminReportRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportRecord
        fields = '__all__'
        read_only_fields = [
            'created_at',
            'report',
            'deputy_record',
            'link',
            'checked_at',
        ]

    def update(self, instance, validated_data):
        admin_fields = ['score', 'score_explanation', 'status']
        admin_fields_changed = any(
            field in validated_data and getattr(instance, field) != validated_data[field]
            for field in admin_fields
        )
        if admin_fields_changed:
            validated_data['checked_at'] = timezone.now()
        return super().update(instance, validated_data)
