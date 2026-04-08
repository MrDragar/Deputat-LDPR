from month_report.models import ReportPeriod, Report, RegionReport, DeputyRecord, ReportRecord
from ldpr_form import constants
from users.models import User


def init_report_records(report: Report, deputy_record: DeputyRecord):
    if report.theme == 'event':
        report_record = ReportRecord.objects.create(
            deputy_record=deputy_record, report=report)
        report_record = ReportRecord.objects.create(
            deputy_record=deputy_record, report=report)
        if deputy_record.level == 'ЗС':
            report_record = ReportRecord.objects.create(
                deputy_record=deputy_record, report=report)
        return
    if report.theme == 'opt_event':
        report_record = ReportRecord.objects.create(
            deputy_record=deputy_record, report=report)
        report_record = ReportRecord.objects.create(
            deputy_record=deputy_record, report=report)
        report_record = ReportRecord.objects.create(
            deputy_record=deputy_record, report=report)
        report_record = ReportRecord.objects.create(
            deputy_record=deputy_record, report=report)
        report_record = ReportRecord.objects.create(
            deputy_record=deputy_record, report=report)
        report_record = ReportRecord.objects.create(
            deputy_record=deputy_record, report=report)
        if deputy_record.level != 'ЗС':
            report_record = ReportRecord.objects.create(
                deputy_record=deputy_record, report=report)
            report_record = ReportRecord.objects.create(
                deputy_record=deputy_record, report=report)
    if report.theme == 'reg_event' and deputy_record.level != 'ЗС':
        return
    report_record = ReportRecord.objects.create(
        deputy_record=deputy_record, report=report)


def init_report(report: Report):
    for region_report in report.report_period.region_reports.all():
        for deputy_record in region_report.deputies_records.all():
            init_report_records(report, deputy_record)


def init_deputy_record(deputy_record: DeputyRecord):
    for report in deputy_record.region_report.report_period.reports.all():
        init_report_records(report, deputy_record)


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


def init_report_period(report_period: ReportPeriod):
    for region in constants.REGIONS:
        region_report = RegionReport.objects.create(region_name=region, report_period=report_period)
        init_region_report(region_report)


def build_excel_data_for_region(region_report: RegionReport) -> dict:
    data = {
        "region": region_report.region_name,
        "Депутаты Законодательных собраний регионов": [],
        "Депутаты административных центров регионов": [],
        "Депутаты муниципальных образований": []
    }

    level_mapping = {
        "ЗС": "Депутаты Законодательных собраний регионов",
        "АЦС": "Депутаты административных центров регионов",
        "МСУ": "Депутаты муниципальных образований"
    }

    # Оптимизированный запрос со всеми связанными данными
    deputies = region_report.deputies_records.select_related(
        'deputy'
    ).prefetch_related(
        'report_records__report'
    )

    EVENT_KEY = "Мероприятия по взаимодействию с избирателями, отраслевыми экспертными сообществами (в т.ч. по отработке ключевых информационных поводов)"

    for deputy_rec in deputies:
        # Извлекаем дополнительные данные пользователя (заглушки/безопасный доступ)
        settlement = ""
        contact = ""
        if deputy_rec.deputy and hasattr(deputy_rec.deputy, 'deputy_form'):
            settlement = getattr(deputy_rec.deputy.deputy_form, 'region', region_report.region_name)
            contact = getattr(deputy_rec.deputy.deputy_form, 'contact', '')  # Подставьте свое поле

        dep_dict = {
            "fio": deputy_rec.fio,
            "is_available": deputy_rec.is_available,
            "settlement": settlement,
            "contact": contact,
            "reason": deputy_rec.reason or "",
            "ВДПГ": {},
            "Посты по информационным ударам": {},
            EVENT_KEY: {
                "опционально": []
            }
        }

        vdpg_idx = 1
        info_idx = 1
        ev_idx = 1

        for rec in deputy_rec.report_records.all():
            rep = rec.report

            # Формируем строку represent
            represent = rec.link if rec.link else "Отсутствует ссылка"
            if rec.link and rec.score_explanation:
                represent = f"{rec.link} {rec.score_explanation}"

            score = rec.score

            if rep.theme == "vdpg":
                dep_dict["ВДПГ"][f"vdpg_{vdpg_idx}"] = {"score": score, "represent": represent}
                vdpg_idx += 1
            elif rep.theme == "infoudar":
                dep_dict["Посты по информационным ударам"][f"post_{info_idx}"] = {"score": score,
                                                                                  "represent": represent}
                info_idx += 1
            elif rep.theme in ("event", "reg_event", "opt_event"):
                events_dict = dep_dict[EVENT_KEY]
                if rep.theme == "event":
                    events_dict[str(ev_idx)] = {"score": score, "represent": represent}
                    ev_idx += 1
                elif rep.theme == "reg_event":
                    events_dict["4 в рег. парламенте"] = {"score": score, "represent": represent}
                elif rep.theme == "opt_event":
                    events_dict["опционально"].append({"score": score, "represent": represent})

        # Распределяем по уровням
        group_name = level_mapping.get(deputy_rec.level)
        if group_name:
            data[group_name].append(dep_dict)

    return data

