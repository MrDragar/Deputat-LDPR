from django.db import models

from ldpr_form.constants import REPRESENTATIVE_BODY_LEVELS, \
    make_choices_from_list
from users.models import User


class ReportPeriod(models.Model):
    # id = models.IntegerField(primary_key=True, verbose_name="Номер", auto_created=True)
    start_date = models.DateField(verbose_name="Дата начала")
    end_date = models.DateField(verbose_name="Дата окончания")

    class Meta:
        verbose_name = "Отчётный период"
        verbose_name_plural = "Отчётные периоды"


class Report(models.Model):
    THEMES = {
        "infoudar": "Инфоудар",
        "vdpg": "ВДПГ",
        "event": "Мероприятие",
        "reg_event": "Мероприятие в рег. парламенте",
        "opt_event": "Опциональное мероприятие",
        "letter": "Письмо"
    }
    # id = models.IntegerField(primary_key=True, verbose_name="Номер поля", auto_created=True, blank=True)
    report_period = models.ForeignKey(ReportPeriod, on_delete=models.CASCADE, related_name="reports")
    start_date = models.DateField(verbose_name="Дата начала", null=True, blank=True)
    end_date = models.DateField(verbose_name="Дата конца", null=True, blank=True)
    name = models.CharField(max_length=100, null=True, blank=True, verbose_name="Название поля")
    description = models.TextField(null=True, blank=True, verbose_name="Описание")
    theme = models.CharField(choices=THEMES)

    class Meta:
        verbose_name = "Поле отчёта"
        verbose_name_plural = "Поля отчёта"


class RegionReport(models.Model):
    # id = models.IntegerField(primary_key=True, auto_created=True, blank=True)
    region_name = models.CharField(max_length=100)
    report_period = models.ForeignKey(ReportPeriod, on_delete=models.CASCADE, related_name="region_reports")


class DeputyRecord(models.Model):
    # id = models.IntegerField(primary_key=True, auto_created=True, blank=True)
    deputy = models.ForeignKey(User, on_delete=models.CASCADE, related_name="period_records", null=True, blank=True)
    region_report = models.ForeignKey(RegionReport, on_delete=models.CASCADE, related_name="deputies_records")
    fio = models.CharField(max_length=100, verbose_name="ФИО")
    is_available = models.BooleanField(default=True, verbose_name="Статус активности")
    level = models.CharField(choices=make_choices_from_list(REPRESENTATIVE_BODY_LEVELS), null=False)
    reason = models.CharField(max_length=1000, verbose_name="Причина невзаимодействия", null=True, blank=True)

    class Meta:
        verbose_name = "Запись депутата"
        verbose_name_plural = "Записи депутатов"


class ReportRecord(models.Model):
    # id = models.IntegerField(primary_key=True, auto_created=True, blank=True)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="records")
    deputy_record = models.ForeignKey(DeputyRecord, on_delete=models.CASCADE, related_name="report_records")
    link = models.URLField(null=True, verbose_name="Ссылка")

    class Meta:
        verbose_name = "Отчёт депутата"
        verbose_name_plural = "Отчёты депутата"
