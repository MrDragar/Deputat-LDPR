from month_report.models import ReportPeriod, Report, RegionReport, DeputyRecord, ReportRecord
from ldpr_form import constants
from users.models import User


def init_deputy_record(deputy_record: DeputyRecord):
    for report in deputy_record.region_report.report_period.reports.all():
        report_record = ReportRecord.objects.create(deputy_record=deputy_record, report=report)


def init_region_report(region_report: RegionReport):
    region_users = (User.objects
                    .filter(deputy_form__region=region_report.region_name)
                    .filter(is_active=True)
                    .filter(deputy_form__representative_body_level__in=["ЗС", "АЦС", "МСУ"]))

    for user in region_users:
        fio = f"{user.deputy_form.last_name} {user.deputy_form.first_name} {user.deputy_form.middle_name or ''}".strip()
        deputy_record = DeputyRecord.objects.create(
            deputy=user, region_report=region_report, fio=fio,
            is_available=True, level=user.deputy_form.representative_body_level
        )
        init_deputy_record(deputy_record)


def init_report_period(report_period: ReportPeriod):
    for region in constants.REGIONS:
        region_report = RegionReport.objects.create(region_name=region, report_period=report_period)
        init_region_report(region_report)
