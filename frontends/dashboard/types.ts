// Raw data types from res.json
export type RawAppealData = Record<string, number | string>;

export interface RawRegionalStatistic {
    "Наименование регионального отделения ЛДПР": string | number;
    "Общее количество депутатов ЗС": number | string;
    "Количество депутатов ЗС, взаимодействующих с РО": number | string;
    "Количество депутатов ЗС, проводивших прием": number | string;
    "Общее количество депутатов АЦС": number | string;
    "Количество депутатов АЦС, взаимодействующих с РО": number | string;
    "Количество депутатов АЦС, проводивших прием": number | string;
    "Общее количество депутатов ОМСУ": number | string;
    "Количество депутатов ОМСУ, взаимодействующих с РО": number | string;
    "Количество депутатов ОМСУ, проводивших прием": number | string;
    "Общее количество граждан, принятых всеми депутатами": number | string;
    "appeals": RawAppealData;
    [key: string]: any; // Allow other properties
}

export interface RawDatedStatistics {
    date: string | null;
    statistics: RawRegionalStatistic[];
}

// Processed data types used in the application
export interface DeputyStats {
  total: number;
  interacting: number;
  reception: number;
}

export type DeputyType = 'zs' | 'acs' | 'omsu';

export interface ProcessedRegionalData {
  region: string;
  totalCitizens: number;
  appeals: Record<string, number>;
  data: Record<DeputyType, DeputyStats>;
}

export interface DatedStatistics {
  date: string;
  statisticsByRegion: Record<string, ProcessedRegionalData>;
}

export interface ProcessedData {
    dataByDate: Record<string, DatedStatistics>;
    regionOptions: string[];
    dateOptions: { label: string, value: string }[];
    appealTopics: string[];
}

// FIX: Added a shared ChartDataItem type for appeal charts to ensure type safety.
export interface ChartDataItem {
    date: string;
    [key: string]: string | number;
}

// FIX: Added types for legacy mockData.ts to resolve import errors.
export type Status = 'reported' | 'no_current_report' | 'no_reports' | 'not_applicable' | 'accounted_in_zs';

export interface ReceptionData {
  value: string;
  count: number | null;
  extra: number | null;
}

export interface MockDeputyStats {
    status: Status;
    total: number | null;
    interacting: number | null;
    receptionCurrent: ReceptionData;
    receptionPrevious: ReceptionData;
}

export interface RegionalData {
    region: string;
    data: {
        zs: MockDeputyStats;
        acs: MockDeputyStats;
        omsu: MockDeputyStats;
    };
}

// Types for lawmaking data from law_res.json
export interface LawData {
    region_name: string;
    federal_laws: Record<string, string>;
    others: {
        contributed: number;
        accepted: number;
    };
}

export interface ProcessedLawData {
    lawList: string[];
    regionOptions: string[];
    dataByRegion: Record<string, LawData>;
}
