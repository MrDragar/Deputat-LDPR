from django.contrib import admin
from month_report.models import Report, ReportPeriod, ReportRecord, DeputyRecord


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    ...


@admin.register(ReportRecord)
class ReportRecordAdmin(admin.ModelAdmin):
    ...


@admin.register(DeputyRecord)
class DeputyRecordAdmin(admin.ModelAdmin):
    ...


@admin.register(ReportPeriod)
class ReportPerdiodAdmin(admin.ModelAdmin):
    ...
