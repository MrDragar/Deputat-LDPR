import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ProcessedData, ChartDataItem } from '../types';
import { AppealsStackedBarChart } from './AppealsStackedBarChart';
import { getAppealColors } from '../utils/colorUtils';
import { CheckboxDropdown } from './CheckboxDropdown';

interface AppealsPageProps {
    allData: ProcessedData;
    selectedRegions: string[];
    onRegionsChange: (regions: string[]) => void;
    selectedDates: string[];
    onDatesChange: (dates: string[]) => void;
    onBack: () => void;
}

export const AppealsPage: React.FC<AppealsPageProps> = ({ allData, selectedRegions, onRegionsChange, selectedDates, onDatesChange, onBack }) => {

    const { allTopics, colors, chartData } = useMemo(() => {
        const allTopics = allData.appealTopics;
        const colors = getAppealColors(allTopics);
        
        const filteredRegionNames = selectedRegions.length > 0 ? new Set(selectedRegions) : null;
        const dateOptionsToProcess = allData.dateOptions.filter(opt => selectedDates.includes(opt.value));
        
        const chartData = dateOptionsToProcess.map(dateOption => {
            const date = dateOption.value;
            const dataForPeriod = Object.values(allData.dataByDate[date]?.statisticsByRegion ?? {});
            
            const relevantData = filteredRegionNames
                ? dataForPeriod.filter(stat => filteredRegionNames.has(stat.region))
                : dataForPeriod;
            
            const periodTotals: { [key: string]: string | number } = { date: dateOption.value };
            
            allTopics.forEach(topic => {
                periodTotals[topic] = relevantData.reduce((sum, regionStat) => sum + (regionStat.appeals[topic] || 0), 0);
            });
            
            return periodTotals as ChartDataItem;
        });

       return { allTopics, colors, chartData };
    }, [allData, selectedRegions, selectedDates]);

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-brand-on-surface-primary">Общая статистика по обращениям</h1>
                        <p className="text-brand-on-surface-secondary mt-1">Анализ обращений по выбранным периодам и регионам</p>
                    </div>
                </div>
            </header>

            <section>
                <AppealsStackedBarChart
                    title="Динамика обращений по темам"
                    subtitle="Накопительная диаграмма по выбранным регионам"
                    chartData={chartData}
                    topics={allTopics}
                    colors={colors}
                    headerControls={
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="w-full sm:w-64">
                                <CheckboxDropdown
                                    title="Региональные отделения"
                                    options={allData.regionOptions}
                                    selectedOptions={selectedRegions}
                                    onChange={onRegionsChange}
                                />
                            </div>
                            <div className="w-full sm:w-64">
                                <CheckboxDropdown
                                    title="Отчетный период"
                                    options={allData.dateOptions}
                                    selectedOptions={selectedDates}
                                    onChange={onDatesChange}
                                />
                            </div>
                        </div>
                    }
                />
            </section>
        </div>
    );
};