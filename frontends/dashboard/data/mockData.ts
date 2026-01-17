
// FIX: Changed import to use MockDeputyStats aliased as DeputyStats to resolve type conflicts.
import type { RegionalData, ReceptionData, MockDeputyStats as DeputyStats, Status } from '../types';

const parseReception = (value: string): ReceptionData => {
    if (!value || value.includes('?') || value.includes('Нет отчета')) {
        const countMatch = value.match(/(\d+)/);
        return { value, count: countMatch ? parseInt(countMatch[1]) : null, extra: null };
    }
    const match = value.match(/(\d+)\s*\(([-+]?\d+)(%?)\)/);
    if (match) {
        return {
            value,
            count: parseInt(match[1]),
            extra: parseInt(match[2]),
        };
    }
    return { value, count: null, extra: null };
};

const createStats = (status: Status, total: number | null, interacting: number | null, receptionCurrentStr: string, receptionPreviousStr: string): DeputyStats => {
    return {
        status,
        total,
        interacting,
        receptionCurrent: parseReception(receptionCurrentStr),
        receptionPrevious: parseReception(receptionPreviousStr),
    };
};

const naStat: DeputyStats = { status: 'not_applicable', total: null, interacting: null, receptionCurrent: { value: 'Нет представительства', count: null, extra: null }, receptionPrevious: { value: '', count: null, extra: null } };
const noCurrentReportStat = (prev: string): DeputyStats => createStats('no_current_report', null, null, 'Нет отчета', prev);
const noReportsStat: DeputyStats = createStats('no_reports', null, null, 'Нет обоих отчетов', '');
const accountedInZsStat: DeputyStats = { status: 'accounted_in_zs', total: null, interacting: null, receptionCurrent: { value: 'Учтено в ЗС', count: null, extra: null }, receptionPrevious: { value: '', count: null, extra: null } };
const noOmsuDeputies: DeputyStats = { status: 'not_applicable', total: null, interacting: null, receptionCurrent: { value: 'Нет депутатов ОМСУ', count: null, extra: null }, receptionPrevious: { value: '', count: null, extra: null } };


export const allRegionalData: RegionalData[] = [
    { region: 'Адыгейское РО', data: {
        zs: createStats('reported', 3, 3, '2 (67%)', '3 (-1)'),
        acs: createStats('reported', 4, 4, '4 (100%)', '4 (0)'),
        omsu: createStats('reported', 33, 29, '6 (21%)', '29 (-23)'),
    }},
    { region: 'Алтайское республиканское отделение', data: {
        zs: noCurrentReportStat('2 (?)'),
        acs: noCurrentReportStat('0 (?)'),
        omsu: noCurrentReportStat('1 (?)'),
    }},
    { region: 'Башкортостанское РО', data: {
        zs: createStats('reported', 4, 4, '4 (100%)', '4 (0)'),
        acs: createStats('reported', 3, 3, '3 (100%)', '3 (0)'),
        omsu: createStats('reported', 215, 168, '124 (74%)', '126 (-2)'),
    }},
    { region: 'Бурятское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Дагестанское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Донецкое РО', data: {
        zs: createStats('reported', 6, 6, '2 (34%)', '3 (-1)'),
        acs: createStats('reported', 3, 3, '3 (100%)', '2 (1)'),
        omsu: createStats('reported', 35, 35, '21 (60%)', '9 (12)'),
    }},
    { region: 'Ингушское РО', data: {
        zs: noCurrentReportStat('2 (?)'),
        acs: noCurrentReportStat('1 (?)'),
        omsu: noCurrentReportStat('6 (?)'),
    }},
    { region: 'Кабардино-Балкарское РО', data: {
        zs: noCurrentReportStat('2 (?)'),
        acs: noCurrentReportStat('1 (?)'),
        omsu: noCurrentReportStat('5 (?)'),
    }},
    { region: 'Калмыцкое РО', data: {
        zs: noCurrentReportStat('0 (?)'),
        acs: noCurrentReportStat('1 (?)'),
        omsu: noCurrentReportStat('0 (?)'),
    }},
    { region: 'Карачаево-Черкесское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Карельское РО', data: {
        zs: noCurrentReportStat('1 (?)'),
        acs: noCurrentReportStat('0 (?)'),
        omsu: noCurrentReportStat('2 (?)'),
    }},
    { region: 'Коми РО', data: {
        zs: createStats('reported', 3, 0, '0 (0%)', '0 (0)'),
        acs: createStats('reported', 2, 2, '1 (50%)', '1 (0)'),
        omsu: createStats('reported', 28, 19, '1 (6%)', '0 (1)'),
    }},
    { region: 'Крымское РО', data: {
        zs: createStats('reported', 3, 3, '3 (100%)', '2 (1)'),
        acs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        omsu: createStats('reported', 39, 24, '15 (63%)', '16 (-1)'),
    }},
    { region: 'Луганское РО', data: {
        zs: createStats('reported', 5, 5, '5 (100%)', 'Нет отчета'),
        acs: createStats('reported', 2, 2, '2 (100%)', 'Нет отчета'),
        omsu: createStats('reported', 54, 52, '52 (100%)', 'Нет отчета'),
    }},
    { region: 'Марийское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        acs: naStat,
        omsu: createStats('reported', 20, 12, '12 (100%)', '12 (0)'),
    }},
    { region: 'Мордовское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        acs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        omsu: createStats('reported', 3, 3, '3 (100%)', '3 (0)'),
    }},
    { region: 'Якутское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 48, 5, '0 (0%)', '5 (-5)'),
    }},
    { region: 'Северо-Осетинское РО', data: {
        zs: naStat,
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 3, 3, '1 (34%)', '1 (0)'),
    }},
    { region: 'Татарстанское РО', data: {
        zs: createStats('reported', 2, 1, '1 (100%)', '1 (0)'),
        acs: createStats('reported', 1, 0, '0 (0%)', '0 (0)'),
        omsu: createStats('reported', 217, 63, '35 (56%)', '51 (-16)'),
    }},
    { region: 'Тывинское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 9, 6, '1 (17%)', '2 (-1)'),
    }},
    { region: 'Удмуртское РО', data: {
        zs: noCurrentReportStat('4 (?)'),
        acs: noCurrentReportStat('2 (?)'),
        omsu: noCurrentReportStat('18 (?)'),
    }},
    { region: 'Хакасское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Чеченское РО', data: {
        zs: noCurrentReportStat('0 (?)'),
        acs: noCurrentReportStat('0 (?)'),
        omsu: noCurrentReportStat('2 (?)'),
    }},
    { region: 'Чувашское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', 'Нет отчета'),
        acs: createStats('reported', 3, 3, '2 (67%)', 'Нет отчета'),
        omsu: noOmsuDeputies,
    }},
    { region: 'Алтайское РО', data: {
        zs: createStats('reported', 3, 3, '3 (100%)', '3 (0)'),
        acs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        omsu: createStats('reported', 25, 14, '14 (100%)', '12 (2)'),
    }},
    { region: 'Забайкальское РО', data: {
        zs: createStats('reported', 4, 4, '4 (100%)', '4 (0)'),
        acs: naStat,
        omsu: createStats('reported', 41, 39, '39 (100%)', '39 (0)'),
    }},
    { region: 'Камчатское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Краснодарское РО', data: {
        zs: createStats('reported', 3, 3, '2 (67%)', '2 (0)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 324, 270, '125 (47%)', '210 (-85)'),
    }},
    { region: 'Красноярское РО', data: {
        zs: noCurrentReportStat('2 (?)'),
        acs: noCurrentReportStat('4 (?)'),
        omsu: noCurrentReportStat('104 (?)'),
    }},
    { region: 'Пермское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Приморское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', 'Нет отчета'),
        acs: createStats('reported', 2, 2, '2 (100%)', 'Нет отчета'),
        omsu: createStats('reported', 17, 17, '8 (48%)', 'Нет отчета'),
    }},
    { region: 'Ставропольское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Хабаровское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Амурское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        acs: naStat,
        omsu: createStats('reported', 14, 14, '14 (100%)', '14 (0)'),
    }},
    { region: 'Архангельское РО', data: {
        zs: noCurrentReportStat('2 (?)'),
        acs: noCurrentReportStat('1 (?)'),
        omsu: noCurrentReportStat('4 (?)'),
    }},
    { region: 'Астраханское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 63, 9, '9 (100%)', '13 (-4)'),
    }},
    { region: 'Белгородское РО', data: {
        zs: noCurrentReportStat('1 (?)'),
        acs: noCurrentReportStat('1 (?)'),
        omsu: noCurrentReportStat('6 (?)'),
    }},
    { region: 'Брянское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Владимирское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Волгоградское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        acs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        omsu: createStats('reported', 128, 29, '8 (28%)', '20 (-12)'),
    }},
    { region: 'Вологодское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        acs: createStats('reported', 2, 2, '1 (50%)', '1 (0)'),
        omsu: createStats('reported', 9, 7, '5 (72%)', '5 (0)'),
    }},
    { region: 'Воронежское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Запорожское РО', data: {
        zs: createStats('reported', 2, 2, '1 (50%)', '2 (-1)'),
        acs: naStat,
        omsu: createStats('reported', 5, 5, '2 (40%)', '4 (-2)'),
    }},
    { region: 'Ивановское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Иркутское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', 'Нет отчета'),
        acs: createStats('reported', 1, 1, '1 (100%)', 'Нет отчета'),
        omsu: createStats('reported', 156, 126, '56 (45%)', 'Нет отчета'),
    }},
    { region: 'Калининградское РО', data: {
        zs: createStats('reported', 2, 2, '1 (50%)', '1 (0)'),
        acs: naStat,
        omsu: createStats('reported', 10, 5, '5 (100%)', '5 (0)'),
    }},
    { region: 'Калужское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Кемеровское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 17, 17, '15 (89%)', '16 (-1)'),
    }},
    { region: 'Кировское РО', data: {
        zs: createStats('reported', 2, 2, '1 (50%)', '1 (0)'),
        acs: createStats('reported', 4, 4, '0 (0%)', '1 (-1)'),
        omsu: createStats('reported', 44, 31, '0 (0%)', '4 (-4)'),
    }},
    { region: 'Костромское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Курганское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Курское РО', data: {
        zs: createStats('reported', 2, 1, '1 (100%)', '1 (0)'),
        acs: createStats('reported', 2, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 37, 15, '2 (14%)', '8 (-6)'),
    }},
    { region: 'Ленинградское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Липецкое РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Магаданское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Московское областное отделение', data: {
        zs: createStats('reported', 2, 1, '1 (100%)', '2 (0)'),
        acs: naStat,
        omsu: createStats('reported', 52, 36, '33 (92%)', '37 (-4)'),
    }},
    { region: 'Мурманское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        acs: createStats('reported', 1, 1, '0 (0%)', '0 (0)'),
        omsu: createStats('reported', 7, 7, '3 (43%)', '1 (2)'),
    }},
    { region: 'Нижегородское РО', data: {
        zs: createStats('reported', 2, 2, '1 (50%)', '1 (0)'),
        acs: createStats('reported', 2, 2, '1 (50%)', '1 (0)'),
        omsu: createStats('reported', 35, 18, '10 (56%)', '6 (4)'),
    }},
    { region: 'Новгородское РО', data: {
        zs: noCurrentReportStat('1 (?)'),
        acs: noCurrentReportStat('1 (?)'),
        omsu: noCurrentReportStat('3 (?)'),
    }},
    { region: 'Новосибирское РО', data: {
        zs: naStat,
        acs: naStat,
        omsu: createStats('reported', 231, 30, '8 (27%)', '11 (-3)'),
    }},
    { region: 'Омское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '0 (1)'),
        acs: naStat,
        omsu: createStats('reported', 8, 8, '8 (100%)', '4 (4)'),
    }},
    { region: 'Оренбургское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '1 (1)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 10, 5, '0 (0%)', '1 (-1)'),
    }},
    { region: 'Орловское РО', data: {
        zs: createStats('reported', 3, 1, '1 (100%)', 'Нет отчета'),
        acs: createStats('reported', 1, 0, '0 (0%)', 'Нет отчета'),
        omsu: createStats('reported', 16, 12, '7 (59%)', 'Нет отчета'),
    }},
    { region: 'Пензенское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 22, 18, '17 (95%)', '18 (-1)'),
    }},
    { region: 'Псковское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 35, 35, '28 (80%)', '25 (3)'),
    }},
    { region: 'Ростовское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Рязанское РО', data: {
        zs: createStats('reported', 3, 1, '1 (100%)', '1 (0)'),
        acs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        omsu: createStats('reported', 10, 5, '5 (100%)', '10 (-5)'),
    }},
    { region: 'Самарское РО', data: {
        zs: noCurrentReportStat('1 (?)'),
        acs: noCurrentReportStat('1 (?)'),
        omsu: noCurrentReportStat('12 (?)'),
    }},
    { region: 'Саратовское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '4 (-2)'),
        acs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        omsu: createStats('reported', 31, 20, '20 (100%)', '20 (0)'),
    }},
    { region: 'Сахалинское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Свердловское РО', data: {
        zs: createStats('reported', 2, 2, '1 (50%)', 'Нет отчета'),
        acs: createStats('reported', 3, 3, '2 (67%)', 'Нет отчета'),
        omsu: createStats('reported', 17, 17, '10 (59%)', 'Нет отчета'),
    }},
    { region: 'Смоленское РО', data: {
        zs: noCurrentReportStat('3 (?)'),
        acs: noCurrentReportStat('1 (?)'),
        omsu: noCurrentReportStat('2 (?)'),
    }},
    { region: 'Тамбовское РО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 11, 11, '7 (64%)', '11 (-4)'),
    }},
    { region: 'Тверское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Томское РО', data: {
        zs: createStats('reported', 3, 3, '3 (100%)', 'Нет отчета'),
        acs: createStats('reported', 2, 2, '2 (100%)', 'Нет отчета'),
        omsu: createStats('reported', 30, 11, '8 (73%)', 'Нет отчета'),
    }},
    { region: 'Тульское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        acs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        omsu: createStats('reported', 30, 24, '15 (63%)', '15 (0)'),
    }},
    { region: 'Тюменское РО', data: {
        zs: createStats('reported', 4, 4, '3 (75%)', '3 (0)'),
        acs: createStats('reported', 4, 4, '4 (100%)', '3 (1)'),
        omsu: createStats('reported', 22, 22, '16 (73%)', '17 (-1)'),
    }},
    { region: 'Ульяновское РО', data: {
        zs: createStats('reported', 3, 3, '3 (100%)', '2 (1)'),
        acs: naStat,
        omsu: createStats('reported', 16, 11, '8 (73%)', '8 (0)'),
    }},
    { region: 'Херсонское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Челябинское РО', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 3, 3, '0 (0%)', '1 (-1)'),
    }},
    { region: 'Ярославское РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Московское городское отделение', data: {
        zs: createStats('reported', 2, 2, '2 (100%)', '2 (0)'),
        acs: accountedInZsStat,
        omsu: createStats('reported', 11, 9, '5 (56%)', '6 (-1)'),
    }},
    { region: 'Санкт-Петербургское РО', data: {
        zs: noCurrentReportStat('2 (?)'),
        acs: accountedInZsStat,
        omsu: noCurrentReportStat('2 (?)'),
    }},
    { region: 'Севастопольское городское отделение', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        acs: accountedInZsStat,
        omsu: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
    }},
    { region: 'РО в ЕАО', data: {
        zs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        acs: createStats('reported', 2, 2, '0 (0%)', '1 (-1)'),
        omsu: createStats('reported', 11, 5, '0 (0%)', '2 (-2)'),
    }},
    { region: 'Ненецкое РО', data: { zs: noReportsStat, acs: noReportsStat, omsu: noReportsStat }},
    { region: 'Ханты-Мансийское РО', data: {
        zs: createStats('reported', 3, 2, '3 (150%)', '3 (0)'),
        acs: createStats('reported', 2, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 27, 16, '6 (38%)', '11 (-5)'),
    }},
    { region: 'Чукотское РО', data: {
        zs: noCurrentReportStat('1 (?)'),
        acs: noCurrentReportStat('1 (?)'),
        omsu: noCurrentReportStat('1 (?)'),
    }},
    { region: 'Ямало-Ненецкое РО', data: {
        zs: createStats('reported', 2, 2, '1 (50%)', '2 (-1)'),
        acs: createStats('reported', 1, 1, '1 (100%)', '1 (0)'),
        omsu: createStats('reported', 13, 13, '4 (31%)', '6 (-2)'),
    }},
];
