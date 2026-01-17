import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Users, UserCheck, Mic, TrendingUp, TrendingDown, Mail } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line } from 'recharts';
import type { ProcessedData, DeputyType, ChartDataItem } from '../types';
import { UI_COLORS, DEPUTY_TYPE_FILTERS } from '../constants';
import { ToggleButtonGroup } from './ToggleButtonGroup';
import { AppealsStackedBarChart } from './AppealsStackedBarChart';
import { getAppealColors } from '../utils/colorUtils';
import { CheckboxDropdown } from './CheckboxDropdown';

interface AllRegionsAnalyticsProps {
    allData: ProcessedData;
    onBack: () => void;
    selectedDeputyTypes: DeputyType[];
    onDeputyTypeChange: (type: string) => void;
    selectedDates: string[];
    onDatesChange: (dates: string[]) => void;
    selectedRegions: string[];
    onRegionsChange: (regions: string[]) => void;
}
interface MetricData {
    value: number;
    breakdown: Record<DeputyType, number>;
}
interface ComparisonData {
    change: number;
    breakdownChange: Record<DeputyType, number>;
}


const ChangeIndicator: React.FC<{ change: number; comparisonLabel?: string }> = ({ change, comparisonLabel }) => {
    if (isNaN(change)) return null;

    const isPositive = change > 0;
    const isZero = change === 0;

    const color = isZero ? 'text-gray-500' : isPositive ? 'text-brand-positive' : 'text-brand-negative';
    const sign = isPositive ? '+' : '-';
    
    const displayValue = isZero ? `(- 0)` : `(${sign}${Math.abs(change).toLocaleString('ru-RU')})`;
    
    const tooltipText = comparisonLabel || '';

    return (
        <div className="relative group inline-flex items-center ml-2">
            <span className={`text-sm font-medium ${color}`}>
                {displayValue}
            </span>
            {tooltipText && (
                 <div
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-solid after:border-transparent after:border-t-gray-800"
                >
                    Сравнение с {tooltipText}
                </div>
            )}
        </div>
    );
};


const MetricDisplay: React.FC<{
    title: string;
    icon: React.ReactNode;
    value: number | string;
    change?: number;
    comparisonLabel?: string;
    breakdown?: Record<DeputyType, number>;
}> = ({ title, icon, value, change, comparisonLabel, breakdown }) => {
    
    const visibleBreakdownItems = useMemo(() => {
        if (!breakdown) return [];
        return DEPUTY_TYPE_FILTERS.filter(type =>
            (breakdown[type.value] !== undefined && breakdown[type.value] !== 0)
        );
    }, [breakdown]);

    return (
        <div className="p-5">
            <div className="flex items-center justify-center space-x-2 text-brand-on-surface-secondary mb-2">
                {icon}
                <p className="text-sm font-semibold">{title}</p>
            </div>
            <div className="flex items-baseline justify-center mb-4">
                <p className="text-4xl font-bold text-brand-on-surface-primary">{typeof value === 'number' ? value.toLocaleString('ru-RU') : value}</p>
                {(change !== undefined && change !== null) && <ChangeIndicator change={change} comparisonLabel={comparisonLabel} />}
            </div>
            {breakdown && visibleBreakdownItems.length > 0 && (
                <div className="flex justify-center items-center text-xs text-brand-on-surface-secondary">
                    {visibleBreakdownItems.map((type, index) => (
                        <React.Fragment key={type.value}>
                            {index > 0 && <div className="h-6 w-px bg-gray-200/80 mx-3"></div>}
                            <div className="text-center px-1">
                                <p className="font-semibold" style={{ color: type.color }}>{type.label}</p>
                                <p className="font-bold text-brand-on-surface-primary text-sm mt-0.5">{breakdown[type.value].toLocaleString('ru-RU')}</p>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};


const ChartContainer: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="bg-brand-surface p-6 rounded-2xl shadow-[0px_4px_12px_rgba(0,0,0,0,0.05)]">
        <h3 className="text-lg font-semibold text-brand-on-surface-primary">{title}</h3>
        <p className="text-sm text-brand-on-surface-secondary mb-8">{subtitle}</p>
        <div className="h-80 w-full">
            {children}
        </div>
    </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const formattedLabel = new Date(payload[0].payload.date.split('.').reverse().join('-')).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const dataPoint = payload[0].payload;
        const totalDeputies = dataPoint.totalDeputies;
        const deputyBreakdown = [
            { name: 'ЗС', value: dataPoint.zs, color: DEPUTY_TYPE_FILTERS[0].color },
            { name: 'АЦС', value: dataPoint.acs, color: DEPUTY_TYPE_FILTERS[1].color },
            { name: 'ОМСУ', value: dataPoint.omsu, color: DEPUTY_TYPE_FILTERS[2].color },
        ];

        // Filter out the Bar payload so we are left with lines
        const linePayloads = payload.filter((p: any) => p.dataKey !== 'totalDeputies');


        return (
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[250px]">
                <p className="font-bold text-brand-on-surface-primary mb-2">{formattedLabel}</p>
                
                <div className="mb-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm font-semibold text-brand-on-surface-primary">Всего депутатов</span>
                        <span className="text-lg font-bold text-brand-on-surface-primary">{totalDeputies.toLocaleString('ru-RU')}</span>
                    </div>
                                         <ul className="pl-2 mt-1 space-y-0 border-l-2 border-gray-200 ml-1">

                        {deputyBreakdown.filter(item => item.value > 0).map(item => (
                            <li key={item.name} className="flex justify-between items-center text-xs">
                                <div className="flex items-center">
                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-brand-on-surface-secondary">{item.name}:</span>
                                </div>
                                <span className="font-medium text-brand-on-surface-secondary">{item.value.toLocaleString('ru-RU')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="pt-2 border-t border-gray-100 space-y-1">
                    {linePayloads.map((entry: any) => (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ border: `2px solid ${entry.color}` }}></span>
                                <span style={{ color: entry.color }}>{entry.name}:</span>
                            </div>
                            <span style={{ color: entry.color }} className="font-semibold">{entry.value.toLocaleString('ru-RU')}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const formatXAxisTick = (dateStr: string) => {
    const [day, monthNum] = dateStr.split('.');
    const date = new Date(2025, parseInt(monthNum, 10) - 1, parseInt(day));
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace(' г.', '').replace('.', '');
};

export const AllRegionsAnalytics: React.FC<AllRegionsAnalyticsProps> = ({ allData, onBack, selectedDeputyTypes, onDeputyTypeChange, selectedDates, onDatesChange, selectedRegions, onRegionsChange }) => {
    const [appealChartDates, setAppealChartDates] = useState<string[]>(selectedDates);
    const isMultiDateSelected = selectedDates.length > 1;

    useEffect(() => {
        setAppealChartDates(selectedDates);
    }, [selectedDates]);

    const allRegionsSelected = selectedRegions.length === 0 || selectedRegions.length === allData.regionOptions.length;

    const getDetailedStatsForDates = useCallback((dates: string[]) => {
        const stats = {
            total: { value: 0, breakdown: { zs: 0, acs: 0, omsu: 0 } as Record<DeputyType, number> },
            interacting: { value: 0, breakdown: { zs: 0, acs: 0, omsu: 0 } as Record<DeputyType, number> },
            reception: { value: 0, breakdown: { zs: 0, acs: 0, omsu: 0 } as Record<DeputyType, number> },
            totalCitizens: { value: 0 },
        };
        if (!allData || dates.length === 0) return stats;
        
        const regionsToFilter = !allRegionsSelected ? new Set(selectedRegions) : null;

        dates.forEach(date => {
            const periodData = allData.dataByDate[date];
            if (!periodData) return;

            Object.values(periodData.statisticsByRegion)
            .filter(regionData => !regionsToFilter || regionsToFilter.has(regionData.region))
            .forEach(regionData => {
                selectedDeputyTypes.forEach(type => {
                    const typeData = regionData.data[type];
                    if (typeData) {
                        stats.total.value += typeData.total ?? 0;
                        stats.total.breakdown[type] += typeData.total ?? 0;
        
                        stats.interacting.value += typeData.interacting ?? 0;
                        stats.interacting.breakdown[type] += typeData.interacting ?? 0;
        
                        stats.reception.value += typeData.reception ?? 0;
                        stats.reception.breakdown[type] += typeData.reception ?? 0;
                    }
                });
                stats.totalCitizens.value += regionData.totalCitizens ?? 0;
            });
        });
    
        return stats;
    }, [allData, selectedDeputyTypes, selectedRegions, allRegionsSelected]);

    const currentDetailedStats = useMemo(() => getDetailedStatsForDates(selectedDates), [getDetailedStatsForDates, selectedDates]);

    const detailedComparisonStats = useMemo(() => {
        if (!allData || selectedDates.length !== 1) return null;
    
        const selectedDate = selectedDates[0];
        const dateIndex = allData.dateOptions.findIndex(d => d.value === selectedDate);
        if (dateIndex < 1) return null;
    
        const previousDateOption = allData.dateOptions[dateIndex - 1];
        const previousDateValue = previousDateOption.value;
    
        const current = getDetailedStatsForDates([selectedDate]);
        const previous = getDetailedStatsForDates([previousDateValue]);
    
        const calculateChange = (currentMetric: MetricData, previousMetric: MetricData): ComparisonData => {
            return {
                change: currentMetric.value - previousMetric.value,
                breakdownChange: {
                    zs: currentMetric.breakdown.zs - previousMetric.breakdown.zs,
                    acs: currentMetric.breakdown.acs - previousMetric.breakdown.acs,
                    omsu: currentMetric.breakdown.omsu - previousMetric.breakdown.omsu,
                }
            };
        };
        
        return {
            total: calculateChange(current.total, previous.total),
            interacting: calculateChange(current.interacting, previous.interacting),
            reception: calculateChange(current.reception, previous.reception),
            totalCitizens: { change: current.totalCitizens.value - previous.totalCitizens.value },
            comparisonPeriodLabel: previousDateOption.label
        };
    }, [allData, selectedDates, getDetailedStatsForDates]);


    const historicalData = useMemo(() => {
        const regionsToFilter = !allRegionsSelected ? new Set(selectedRegions) : null;
        return allData.dateOptions.map(({ value: date }) => {
            const periodData = allData.dataByDate[date];
            const dataPoint = { date, zs: 0, acs: 0, omsu: 0, totalDeputies: 0, interacting: 0, reception: 0, totalCitizens: 0 };
            if (!periodData) return dataPoint;

            Object.values(periodData.statisticsByRegion)
            .filter(regionStat => !regionsToFilter || regionsToFilter.has(regionStat.region))
            .forEach(regionStat => {
                let regionInteracting = 0;
                let regionReception = 0;
                selectedDeputyTypes.forEach(type => {
                    regionInteracting += regionStat.data[type]?.interacting ?? 0;
                    regionReception += regionStat.data[type]?.reception ?? 0;
                });

                const zsTotal = selectedDeputyTypes.includes('zs') ? (regionStat.data.zs?.total ?? 0) : 0;
                const acsTotal = selectedDeputyTypes.includes('acs') ? (regionStat.data.acs?.total ?? 0) : 0;
                const omsuTotal = selectedDeputyTypes.includes('omsu') ? (regionStat.data.omsu?.total ?? 0) : 0;

                dataPoint.zs += zsTotal;
                dataPoint.acs += acsTotal;
                dataPoint.omsu += omsuTotal;
                dataPoint.totalDeputies += zsTotal + acsTotal + omsuTotal;
                dataPoint.interacting += regionInteracting;
                dataPoint.reception += regionReception;
                dataPoint.totalCitizens += regionStat.totalCitizens;
            });

            return dataPoint;
        });
    }, [allData, selectedDeputyTypes, selectedRegions, allRegionsSelected]);
    
    const historicalAppealsData = useMemo(() => {
        const allTopics = allData.appealTopics;
        const colors = getAppealColors(allTopics);
        const regionsToFilter = !allRegionsSelected ? new Set(selectedRegions) : null;

        const dateOptionsToProcess = allData.dateOptions.filter(opt => appealChartDates.includes(opt.value));

        const chartData = dateOptionsToProcess.map(dateOption => {
            const date = dateOption.value;
            const regionDataArray = allData.dataByDate[date] ? Object.values(allData.dataByDate[date].statisticsByRegion) : [];
            const relevantData = regionsToFilter ? regionDataArray.filter(stat => regionsToFilter.has(stat.region)) : regionDataArray;
            
            const periodTotals: { [key: string]: string | number } = { date: dateOption.value };
            allTopics.forEach(topic => {
                periodTotals[topic] = relevantData.reduce((sum, regionStat) => sum + (regionStat.appeals[topic] || 0), 0);
            });
            return periodTotals as ChartDataItem;
        });
        
       return { allTopics, colors, chartData };
    }, [allData, appealChartDates, selectedRegions, allRegionsSelected]);

    const dotProps = {
        r: 4,
        stroke: UI_COLORS.background,
        strokeWidth: 2,
    };
    const activeDotProps = {
         r: 6,
        stroke: UI_COLORS.background,
        strokeWidth: 2,
    };

    const pageTitle = allRegionsSelected ? 'Все РО' : `Выбранные ${selectedRegions.length} РО`;
    const pageSubtitle = allRegionsSelected
        ? 'Детальная аналитика по всем региональным отделениям'
        : `Детальная аналитика по ${selectedRegions.length} выбранным отделениям`;

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-brand-on-surface-primary">{pageTitle}</h1>
                        <p className="text-brand-on-surface-secondary mt-1">{pageSubtitle}</p>
                    </div>
                </div>
                 <div className="w-full sm:w-auto flex flex-col md:flex-row md:items-end gap-4">
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
                    <div>
                        <ToggleButtonGroup
                            options={DEPUTY_TYPE_FILTERS}
                            selectedOptions={selectedDeputyTypes}
                            onChange={onDeputyTypeChange}
                        />
                    </div>
                </div>
            </header>
            
            <div className="bg-brand-surface rounded-2xl shadow-sm mb-8 overflow-hidden border border-gray-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-200/80">
                    <MetricDisplay
                        title="Всего депутатов"
                        icon={<Users size={18} />}
                        value={isMultiDateSelected ? '—' : currentDetailedStats.total.value}
                        change={detailedComparisonStats?.total.change}
                        comparisonLabel={detailedComparisonStats?.comparisonPeriodLabel}
                        breakdown={isMultiDateSelected ? undefined : currentDetailedStats.total.breakdown}
                    />
                     <MetricDisplay
                        title="Взаимодействующих"
                        icon={<UserCheck size={18} />}
                        value={isMultiDateSelected ? '—' : currentDetailedStats.interacting.value}
                        change={detailedComparisonStats?.interacting.change}
                        comparisonLabel={detailedComparisonStats?.comparisonPeriodLabel}
                        breakdown={isMultiDateSelected ? undefined : currentDetailedStats.interacting.breakdown}
                    />
                    <MetricDisplay
                        title="Проводивших прием"
                        icon={<Mic size={18} />}
                        value={isMultiDateSelected ? '—' : currentDetailedStats.reception.value}
                        change={detailedComparisonStats?.reception.change}
                        comparisonLabel={detailedComparisonStats?.comparisonPeriodLabel}
                        breakdown={isMultiDateSelected ? undefined : currentDetailedStats.reception.breakdown}
                    />
                    <MetricDisplay
                        title="Принято граждан"
                        icon={<Mail size={18} />}
                        value={currentDetailedStats.totalCitizens.value}
                        change={detailedComparisonStats?.totalCitizens.change}
                        comparisonLabel={detailedComparisonStats?.comparisonPeriodLabel}
                    />
                </div>
            </div>

            <div className="space-y-8">
                <ChartContainer title="Динамика показателей" subtitle="Исторические данные по количеству депутатов и граждан">
                    <ResponsiveContainer>
                        <ComposedChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: UI_COLORS.onSurfaceSecondary }} tickFormatter={formatXAxisTick} />
                            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: UI_COLORS.onSurfaceSecondary }}/>
                            <Tooltip content={<CustomTooltip/>}/>
                            <Legend wrapperStyle={{ paddingTop: '24px' }}/>
                            <Bar yAxisId="left" dataKey="totalDeputies" name="Всего депутатов" fill="#4A5568" />
                            <Line yAxisId="left" type="monotone" dataKey="interacting" name="Взаимодействующих" stroke="#22c55e" strokeWidth={2.5} dot={dotProps} activeDot={activeDotProps} />
                            <Line yAxisId="left" type="monotone" dataKey="reception" name="Проводивших прием" stroke="#3b82f6" strokeWidth={2.5} dot={dotProps} activeDot={activeDotProps} />
                            <Line yAxisId="left" type="monotone" dataKey="totalCitizens" name="Принято граждан" stroke="#f97316" strokeWidth={2.5} dot={dotProps} activeDot={activeDotProps} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </ChartContainer>
                
                <AppealsStackedBarChart
                    title="Динамика обращений по темам"
                    subtitle="Анализ тем обращений по всем регионам"
                    chartData={historicalAppealsData.chartData}
                    topics={historicalAppealsData.allTopics}
                    colors={historicalAppealsData.colors}
                    headerControls={
                        <div className="w-full sm:w-64">
                            <CheckboxDropdown
                                title="Отчетный период"
                                options={allData.dateOptions}
                                selectedOptions={appealChartDates}
                                onChange={setAppealChartDates}
                            />
                        </div>
                    }
                />
            </div>
        </div>
    );
};