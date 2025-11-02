from rest_framework import serializers
from .models import ReportPeriod, Report, RegionReport, DeputyRecord, \
    ReportRecord


class ReportPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportPeriod
        fields = '__all__'


class ReportSerializer(serializers.ModelSerializer):
    theme_display = serializers.CharField(source='get_theme_display',
                                          read_only=True)

    class Meta:
        model = Report
        fields = '__all__'


class RegionReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegionReport
        fields = '__all__'


class DeputyRecordSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display',
                                          read_only=True)

    class Meta:
        model = DeputyRecord
        fields = '__all__'


class ReportRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportRecord
        fields = '__all__'