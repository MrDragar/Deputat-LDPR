import type { LawData, ProcessedLawData } from '../types';

export const lawDataProcessor = (rawData: LawData[]): ProcessedLawData => {
    if (!rawData || rawData.length === 0) {
        return { lawList: [], dataByRegion: {}, regionOptions: [] };
    }

    // Filter out entries with invalid region names
    const validData = rawData.filter(regionData => typeof regionData.region_name === 'string' && regionData.region_name.trim());

    if (validData.length === 0) {
        return { lawList: [], dataByRegion: {}, regionOptions: [] };
    }

    const lawList = Object.keys(validData[0].federal_laws);
    const dataByRegion: Record<string, LawData> = {};
    const regionSet = new Set<string>();

    validData.forEach(regionData => {
        dataByRegion[regionData.region_name] = regionData;
        regionSet.add(regionData.region_name);
    });
    
    const regionOptions = Array.from(regionSet).sort((a, b) => a.localeCompare(b, 'ru'));


    return { lawList, dataByRegion, regionOptions };
};
