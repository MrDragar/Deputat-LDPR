import type { RawDatedStatistics, ProcessedData, RawRegionalStatistic, DeputyStats, ProcessedRegionalData, DatedStatistics } from '../types';

const safeParseInt = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

const processRegionalData = (raw: RawRegionalStatistic): ProcessedRegionalData => {
    const zs: DeputyStats = {
        total: safeParseInt(raw['Общее количество депутатов ЗС']),
        interacting: safeParseInt(raw['Количество депутатов ЗС, взаимодействующих с РО']),
        reception: safeParseInt(raw['Количество депутатов ЗС, проводивших прием']),
    };
    const acs: DeputyStats = {
        total: safeParseInt(raw['Общее количество депутатов АЦС']),
        interacting: safeParseInt(raw['Количество депутатов АЦС, взаимодействующих с РО']),
        reception: safeParseInt(raw['Количество депутатов АЦС, проводивших прием']),
    };
    const omsu: DeputyStats = {
        total: safeParseInt(raw['Общее количество депутатов ОМСУ']),
        interacting: safeParseInt(raw['Количество депутатов ОМСУ, взаимодействующих с РО']),
        reception: safeParseInt(raw['Количество депутатов ОМСУ, проводивших прием']),
    };
    
    const appeals: Record<string, number> = {};
    if (raw.appeals && Object.keys(raw.appeals).length > 0) {
        for (const key in raw.appeals) {
            appeals[key] = safeParseInt(raw.appeals[key]);
        }
    } else {
        // Fallback for old data formats
        const appealMapping: Record<string, string> = {
            'Количество обращений по теме - медицина': 'Медицина и здравоохранение',
            'Количество обращений по теме - образование': 'Образование',
            'Количество обращений по теме - социальные вопросы': 'Вопросы назначения пенсий и социальных выплат',
            'Количество обращений по теме - экология (по вывозу мусора, свалкам, полигонам)': 'Несанкционированные свалки, нерегулярный (несвоевременный) вывоз мусора',
            'Количество обращений по теме - ЖКХ': 'ЖКХ',
            'Количество обращений по теме - транспорт': 'Общественный транспорт',
            'Количество обращений по теме - благоустройство': 'Благоустройство',
            'Количество обращений по теме - СВО': 'СВО',
            'Количество обращений по теме - законотворческая инициатива': 'Законотворческая инициатива',
            'Количество обращений по теме - обращения на Председателя ЛДПР': 'Обращения на имя Председателя ЛДПР',
            'Количество обращений по теме - прочее': 'Прочее'
        };
        for (const oldKey in appealMapping) {
             if (raw[oldKey] !== undefined) {
                const newKey = appealMapping[oldKey];
                appeals[newKey] = safeParseInt(raw[oldKey]);
            }
        }
    }
    
    const totalCitizens = raw['Общее количество граждан, принятых всеми депутатами'] !== undefined 
        ? safeParseInt(raw['Общее количество граждан, принятых всеми депутатами'])
        : safeParseInt((raw as any)['Количество принятых граждан']);


    return {
        region: raw['Наименование регионального отделения ЛДПР'] as string,
        totalCitizens,
        appeals,
        data: { zs, acs, omsu },
    };
};

const parseDate = (dateStr: string): Date => {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        // new Date(year, monthIndex, day)
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr); // Fallback
};

export const dataProcessor = (rawData: RawDatedStatistics[]): ProcessedData => {
    const dataByDate: ProcessedData['dataByDate'] = {};
    const regionSet = new Set<string>();
    const topicSet = new Set<string>();

    const validData = rawData.filter(d => d.date && Array.isArray(d.statistics));

    // Sort by date to ensure correct order
    validData.sort((a, b) => parseDate(a.date!).getTime() - parseDate(b.date!).getTime());

    validData.forEach(rawPeriod => {
        const date = rawPeriod.date!;
        const statisticsByRegion: Record<string, ProcessedRegionalData> = {};
        
        rawPeriod.statistics
            .filter(stat => {
                const regionName = stat['Наименование регионального отделения ЛДПР'];
                // Ensure it's a string and not a numeric-like value that indicates bad data.
                return typeof regionName === 'string' && regionName.trim() !== '' && regionName.trim() !== '0';
            })
            .forEach(rawStat => {
                const regionName = rawStat['Наименование регионального отделения ЛДПР'] as string;
                regionSet.add(regionName);
                const processedStat = processRegionalData(rawStat);
                Object.keys(processedStat.appeals).forEach(topic => topicSet.add(topic));
                statisticsByRegion[regionName] = processedStat;
            });
        dataByDate[date] = { date, statisticsByRegion };
    });

    const regionOptions = Array.from(regionSet).sort((a, b) => a.localeCompare(b, 'ru'));
    const appealTopics = Array.from(topicSet).sort((a,b) => a.localeCompare(b, 'ru'));
    
    const dateOptions = Object.keys(dataByDate).map(date => ({
        value: date,
        label: parseDate(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }),
    }));

    return { dataByDate, regionOptions, dateOptions, appealTopics };
};
