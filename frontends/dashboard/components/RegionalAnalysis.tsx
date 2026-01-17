import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart2, Search, Users, UserCheck, Mic, Percent, Clipboard, ListOrdered, TrendingUp, TrendingDown } from 'lucide-react';
import type { ProcessedRegionalData, DeputyType, DeputyStats, ProcessedData } from '../types';
import { ComparisonView } from './ComparisonView';
import { SortDropdown } from './SortDropdown';
import { DEPUTY_TYPE_FILTERS } from '../constants';

interface AggregatedStats {
    total: number;
    interacting: number;
    reception: number;
    totalCitizens: number;
    engagement: number;
    totalByType: Record<DeputyType, number>;
    interactingByType: Record<DeputyType, number>;
    receptionByType: Record<DeputyType, number>;
}


const ChangeIndicator: React.FC<{ change: number; comparisonLabel?: string; unit?: string; showIcon?: boolean }> = ({ change, comparisonLabel, unit = '', showIcon = true }) => {
    if (change === 0 || isNaN(change)) {
        return null;
    }

    const isPositive = change > 0;
    const color = isPositive ? 'text-brand-positive' : 'text-brand-negative';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const sign = isPositive ? '+' : '-';
    const tooltipText = comparisonLabel ? `${comparisonLabel}` : '';

    return (
        <div className="relative group inline-flex items-center ml-2" style={{top: "-1px"}}>
            <span className={`flex items-center text-xs font-medium ${color}`}>
                {showIcon && <Icon size={12} className="mr-0.5" />}
                ({sign}{Math.abs(change).toLocaleString('ru-RU')}{unit})
            </span>
            {tooltipText && (
                 <div
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-solid after:border-transparent after:border-t-gray-800"
                >
                    {tooltipText}
                </div>
            )}
        </div>
    );
};


const StatTooltip: React.FC<{
    stats: AggregatedStats;
    metric: 'total' | 'interacting' | 'reception';
    comparisonData: any | null;
}> = ({ stats, metric, comparisonData }) => {
    const value = stats[metric];
    const valueChange = comparisonData?.change[metric];
    
    const breakdown = stats[`${metric}ByType` as keyof AggregatedStats] as Record<DeputyType, number>;
    const breakdownChanges = comparisonData?.change[`${metric}ByType`];

    return (
        <div className="w-auto min-w-[160px] bg-brand-surface p-2 border border-gray-200 rounded-lg shadow-lg text-sm flex flex-col justify-center text-left">
            <div className="flex items-baseline justify-center text-center mb-1">
                <p className="text-xl font-bold text-brand-on-surface-primary">{value.toLocaleString('ru-RU')}</p>
                 {comparisonData && (
                    <ChangeIndicator
                        change={valueChange}
                        comparisonLabel={comparisonData.comparisonPeriodLabel}
                    />
                )}
            </div>
            <hr className="w-full border-t border-gray-100 mb-1"/>
            <ul className="space-y-0.5 w-full">
                {DEPUTY_TYPE_FILTERS
                    .filter(typeInfo => breakdown[typeInfo.value] > 0)
                    .sort((a, b) => breakdown[b.value] - breakdown[a.value])
                    .map(typeInfo => {
                        const count = breakdown[typeInfo.value];
                        const change = breakdownChanges?.[typeInfo.value] ?? 0;

                        return (
                             <li key={typeInfo.value} className="grid grid-cols-[1fr_auto] items-center text-xs px-1 gap-x-1">
                                <div className="flex items-center">
                                    <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: typeInfo.color }}></span>
                                    <span className="text-brand-on-surface-secondary">{typeInfo.label}</span>
                                </div>
                                <div className="flex items-baseline justify-end">
                                    <span className="font-semibold text-brand-on-surface-primary">{count.toLocaleString('ru-RU')}</span>
                                    {comparisonData && (
                                         <ChangeIndicator
                                            change={change}
                                            comparisonLabel={comparisonData.comparisonPeriodLabel}
                                            showIcon={false}
                                        />
                                    )}
                                </div>
                            </li>
                        );
                })}
            </ul>
        </div>
    );
};

const EngagementTooltip: React.FC<{ stats: AggregatedStats; comparisonData: any | null; }> = ({ stats, comparisonData }) => {
    return (
        <div className="w-auto min-w-[160px] bg-brand-surface p-2 border border-gray-200 rounded-lg shadow-lg text-sm flex flex-col justify-center text-left">
            <div className="flex items-baseline justify-center text-center mb-1">
                <p className="text-xl font-bold text-brand-on-surface-primary">{stats.engagement}%</p>
                 {comparisonData && (
                    <ChangeIndicator
                        change={comparisonData.change.engagement}
                        comparisonLabel={comparisonData.comparisonPeriodLabel}
                        unit="%"
                    />
                )}
            </div>
            <hr className="w-full border-t border-gray-100 mb-1"/>
            <ul className="space-y-0.5 w-full">
                {DEPUTY_TYPE_FILTERS
                    .filter(typeInfo => stats.receptionByType[typeInfo.value] > 0)
                    .sort((a, b) => stats.receptionByType[b.value] - stats.receptionByType[a.value])
                    .map(typeInfo => {
                        const count = stats.receptionByType[typeInfo.value];

                        return (
                             <li key={typeInfo.value} className="grid grid-cols-[1fr_auto] items-center text-xs px-1 gap-x-1">
                                <div className="flex items-center">
                                    <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: typeInfo.color }}></span>
                                    <span className="text-brand-on-surface-secondary">{typeInfo.label}</span>
                                </div>
                                <div className="flex items-baseline justify-end">
                                    <span className="font-semibold text-brand-on-surface-primary">{count}</span>
                                    {comparisonData && (
                                         <ChangeIndicator
                                            change={comparisonData.change.receptionByType[typeInfo.value]}
                                            comparisonLabel={comparisonData.comparisonPeriodLabel}
                                            showIcon={false}
                                        />
                                    )}
                                </div>
                            </li>
                        );
                })}
            </ul>
        </div>
    );
};


const EngagementBreakdownChart: React.FC<{
    breakdown: Record<DeputyType, number>;
    engagementRate: number;
}> = ({ breakdown, engagementRate }) => {
    
    const chartData = useMemo(() => DEPUTY_TYPE_FILTERS
        .map(type => ({
            name: type.label,
            value: breakdown[type.value],
            fill: type.color,
        }))
        .filter(d => d.value > 0), [breakdown]);

    const hasData = chartData.some(d => d.value > 0);

    return (
        <div className="w-24 h-24 relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={hasData ? chartData : [{ value: 1, fill: '#E2E8F0' }]}
                        cx="50%"
                        cy="50%"
                        dataKey="value"
                        innerRadius={28}
                        outerRadius={38}
                        isAnimationActive={false}
                        strokeWidth={2}
                        stroke={"#FFFFFF"}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                         {!hasData && <Cell fill="#E2E8F0" />}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-brand-on-surface-primary">
                    {isNaN(engagementRate) ? 0 : engagementRate}%
                </span>
            </div>
        </div>
    );
};


const RegionCard: React.FC<{ region: string, stats: AggregatedStats, onViewDetails: (region: string) => void, comparisonData: any | null }> = ({ region, stats, onViewDetails, comparisonData }) => {
    const [activeTooltip, setActiveTooltip] = useState<'total' | 'interacting' | 'reception' | 'engagement' | null>(null);

    if (stats.total === 0) {
        return (
            <div className="bg-brand-surface p-6 rounded-2xl shadow-sm flex flex-col justify-between h-full relative">
                 <button 
                    onClick={() => onViewDetails(region)} 
                    className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-brand-primary hover:scale-110 hover:bg-gray-50 transition-all duration-200"
                    aria-label={`Детальная аналитика по ${region}`}
                >
                    <BarChart2 size={20} />
                </button>
                <div>
                    <h3 className="font-bold text-lg text-brand-on-surface-primary max-w-[80%]">{region}</h3>
                    <p className="text-center text-brand-on-surface-secondary mt-12">Нет данных для выбранных типов депутатов</p>
                </div>
            </div>
        )
    }
    
    const renderStat = (metric: 'total' | 'interacting' | 'reception', label: string) => (
        <div
            className="relative"
            onMouseEnter={() => setActiveTooltip(metric)}
            onMouseLeave={() => setActiveTooltip(null)}
        >
            <p className="text-2xl font-semibold text-brand-on-surface-primary">{stats[metric] ?? '—'}</p>
            <p className="text-xs text-brand-on-surface-secondary">{label}</p>
            <AnimatePresence>
                {activeTooltip === metric && (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                    >
                        <StatTooltip stats={stats} metric={metric} comparisonData={comparisonData} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="bg-brand-surface p-5 rounded-2xl shadow-[0px_4px_12px_rgba(0,0,0,0.05)] flex flex-col h-full relative">
            <button 
                onClick={() => onViewDetails(region)} 
                className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-brand-primary hover:scale-110 hover:bg-gray-50 transition-all duration-200"
                aria-label={`Детальная аналитика по ${region}`}
            >
                <BarChart2 size={20} />
            </button>
            <div className="mb-4">
                <h3 className="font-bold text-lg text-brand-on-surface-primary max-w-[80%]">{region}</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
                {renderStat('total', 'Всего')}
                {renderStat('interacting', 'Взаимод.')}
                {renderStat('reception', 'Провели прием')}
            </div>
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-around">
                <div className='text-center'>
                    <p className="text-xs font-semibold text-brand-on-surface-secondary mb-1">Вовлеченность</p>
                    <div 
                        className="relative w-24 h-24 mx-auto"
                        onMouseEnter={() => stats.reception > 0 && setActiveTooltip('engagement')}
                        onMouseLeave={() => setActiveTooltip(null)}
                    >
                         <EngagementBreakdownChart 
                            breakdown={stats.receptionByType}
                            engagementRate={stats.engagement}
                        />
                        <AnimatePresence>
                            {activeTooltip === 'engagement' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                                >
                                    <EngagementTooltip stats={stats} comparisonData={comparisonData} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className='text-center'>
                    <p className="text-xs font-semibold text-brand-on-surface-secondary mb-1">Принято граждан</p>
                    <div className="h-24 flex items-center justify-center">
                         <div className="flex items-baseline">
                            <p className="text-3xl font-bold text-brand-on-surface-primary">{stats.totalCitizens.toLocaleString('ru-RU')}</p>
                            {comparisonData && (
                                <ChangeIndicator
                                    change={comparisonData.change.totalCitizens}
                                    comparisonLabel={comparisonData.comparisonPeriodLabel}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TABS = [
    { id: 'cards', label: 'Карточки' },
    { id: 'chart', label: 'Сравнение' },
];

const SORT_KEYS = [
    { value: 'total', label: 'По кол-ву депутатов', icon: <Users size={16} className="text-brand-on-surface-secondary" /> },
    { value: 'interacting', label: 'По взаимодействующим', icon: <UserCheck size={16} className="text-brand-on-surface-secondary" /> },
    { value: 'reception', label: 'По проводившим прием', icon: <Mic size={16} className="text-brand-on-surface-secondary" /> },
    { value: 'engagement', label: 'По вовлеченности', icon: <Percent size={16} className="text-brand-on-surface-secondary" /> },
    { value: 'totalCitizens', label: 'По принятым гражданам', icon: <Clipboard size={16} className="text-brand-on-surface-secondary" /> },
    { value: 'region', label: 'По названию РО', icon: <ListOrdered size={16} className="text-brand-on-surface-secondary" /> },
];

const ANIMATION_THRESHOLD = 30; // Don't animate if more than 30 cards are shown

interface RegionalAnalysisProps { 
    periodData: ProcessedRegionalData[], 
    selectedRegions: string[], 
    selectedDeputyTypes: DeputyType[],
    onViewDetails: (region: string) => void,
    allData: ProcessedData | null,
    selectedDates: string[],
    sortKey: string,
    onSortKeyChange: (key: string) => void,
    sortDirection: 'asc' | 'desc',
    onSortDirectionChange: (dir: 'asc' | 'desc') => void;
    comparisonRegions: string[];
    onComparisonRegionsChange: (regions: string[]) => void;
}

export const RegionalAnalysis: React.FC<RegionalAnalysisProps> = ({ 
    periodData, 
    selectedRegions, 
    selectedDeputyTypes, 
    onViewDetails, 
    allData, 
    selectedDates,
    sortKey,
    onSortKeyChange,
    sortDirection,
    onSortDirectionChange,
    comparisonRegions,
    onComparisonRegionsChange,
}) => {
    const [activeTab, setActiveTab] = useState<'cards' | 'chart'>('cards');
    const [searchQuery, setSearchQuery] = useState('');
    
    const comparisonDataByRegion = useMemo(() => {
        if (!allData || selectedDates.length !== 1) {
            return null;
        }

        const selectedDate = selectedDates[0];
        const dateIndex = allData.dateOptions.findIndex(d => d.value === selectedDate);

        if (dateIndex < 1) {
            return null;
        }

        const previousDateOption = allData.dateOptions[dateIndex - 1];
        const previousDateValue = previousDateOption.value;
        const comparisonPeriodLabel = `сравнение с ${previousDateOption.label}`;

        const getStatsForDate = (date: string): Map<string, AggregatedStats> => {
            const regionStatsMap = new Map<string, AggregatedStats>();
            const periodDataForDate = allData.dataByDate[date];
            if (!periodDataForDate) return regionStatsMap;

            Object.values(periodDataForDate.statisticsByRegion).forEach(regionalData => {
                 const stats: AggregatedStats = {
                    total: 0, interacting: 0, reception: 0,
                    totalCitizens: regionalData.totalCitizens,
                    engagement: 0,
                    totalByType: { zs: 0, acs: 0, omsu: 0 },
                    interactingByType: { zs: 0, acs: 0, omsu: 0 },
                    receptionByType: { zs: 0, acs: 0, omsu: 0 },
                };

                selectedDeputyTypes.forEach(type => {
                    const typeData = regionalData.data[type];
                    if (typeData) {
                        const total = typeData.total ?? 0;
                        const interacting = typeData.interacting ?? 0;
                        const reception = typeData.reception ?? 0;

                        stats.totalByType[type] += total;
                        stats.interactingByType[type] += interacting;
                        stats.receptionByType[type] += reception;

                        stats.total += total;
                        stats.interacting += interacting;
                        stats.reception += reception;
                    }
                });

                stats.engagement = stats.interacting > 0 ? Math.round((stats.reception / stats.interacting) * 100) : 0;
                regionStatsMap.set(regionalData.region, stats);
            });

            return regionStatsMap;
        };

        const currentStatsMap = getStatsForDate(selectedDate);
        const previousStatsMap = getStatsForDate(previousDateValue);
        
        const comparisonMap = new Map<string, { change: any, comparisonPeriodLabel: string }>();

        currentStatsMap.forEach((currentStats, region) => {
            const previousStats = previousStatsMap.get(region);
            if (!previousStats) return;

            const change = {
                engagement: currentStats.engagement - previousStats.engagement,
                total: currentStats.total - previousStats.total,
                interacting: currentStats.interacting - previousStats.interacting,
                reception: currentStats.reception - previousStats.reception,
                totalCitizens: currentStats.totalCitizens - previousStats.totalCitizens,
                totalByType: {
                    zs: currentStats.totalByType.zs - previousStats.totalByType.zs,
                    acs: currentStats.totalByType.acs - previousStats.totalByType.acs,
                    omsu: currentStats.totalByType.omsu - previousStats.totalByType.omsu,
                },
                interactingByType: {
                    zs: currentStats.interactingByType.zs - previousStats.interactingByType.zs,
                    acs: currentStats.interactingByType.acs - previousStats.interactingByType.acs,
                    omsu: currentStats.interactingByType.omsu - previousStats.interactingByType.omsu,
                },
                receptionByType: {
                    zs: currentStats.receptionByType.zs - previousStats.receptionByType.zs,
                    acs: currentStats.receptionByType.acs - previousStats.receptionByType.acs,
                    omsu: currentStats.receptionByType.omsu - previousStats.receptionByType.omsu,
                }
            };
            comparisonMap.set(region, { change, comparisonPeriodLabel });
        });

        return comparisonMap;
    }, [allData, selectedDates, selectedDeputyTypes]);


    const aggregatedData = useMemo(() => {
        const regionsToProcess = selectedRegions.length > 0 ? periodData.filter(d => selectedRegions.includes(d.region)) : periodData;
        
        return regionsToProcess.map(regionalData => {
            const stats: AggregatedStats = {
                total: 0, interacting: 0, reception: 0,
                totalCitizens: regionalData.totalCitizens,
                engagement: 0,
                totalByType: { zs: 0, acs: 0, omsu: 0 },
                interactingByType: { zs: 0, acs: 0, omsu: 0 },
                receptionByType: { zs: 0, acs: 0, omsu: 0 },
            };

            selectedDeputyTypes.forEach(type => {
                const typeData = regionalData.data[type];
                if (typeData) {
                    const total = typeData.total ?? 0;
                    const interacting = typeData.interacting ?? 0;
                    const reception = typeData.reception ?? 0;
                    
                    stats.totalByType[type] = total;
                    stats.interactingByType[type] = interacting;
                    stats.receptionByType[type] = reception;

                    stats.total += total;
                    stats.interacting += interacting;
                    stats.reception += reception;
                }
            });
            
            stats.engagement = stats.interacting > 0 ? Math.round((stats.reception / stats.interacting) * 100) : 0;
            const comparisonData = comparisonDataByRegion?.get(regionalData.region) || null;

            return { region: regionalData.region, stats, comparisonData };
        }).filter(item => 
            item.region.toLowerCase().includes(searchQuery.toLowerCase().trim())
        ).sort((a, b) => {
            const direction = sortDirection === 'asc' ? 1 : -1;

            if (sortKey === 'region') {
                return a.region.localeCompare(b.region) * direction;
            }
            
            const statA = a.stats[sortKey as keyof Omit<AggregatedStats, 'totalByType' | 'interactingByType' | 'receptionByType'>];
            const statB = b.stats[sortKey as keyof Omit<AggregatedStats, 'totalByType' | 'interactingByType' | 'receptionByType'>];


            if (typeof statA === 'number' && typeof statB === 'number') {
                return (statA - statB) * direction;
            }
            
            return 0;
        });
    }, [periodData, selectedRegions, selectedDeputyTypes, sortKey, sortDirection, searchQuery, comparisonDataByRegion]);

    const enableAnimation = aggregatedData.length < ANIMATION_THRESHOLD;

    const renderContent = () => {
        if (activeTab === 'chart') {
            return <ComparisonView 
                        allData={allData} 
                        selectedDates={selectedDates} 
                        selectedDeputyTypes={selectedDeputyTypes} 
                        comparisonRegions={comparisonRegions}
                        onRegionChange={onComparisonRegionsChange}
                        comparisonDataByRegion={comparisonDataByRegion}
                    />;
        }
        
        const noRegionsSelected = selectedRegions.length === 0;
        const noResultsFromSearch = !noRegionsSelected && aggregatedData.length === 0;

        if (noRegionsSelected && activeTab === 'cards') {
            return (
                <div className="text-center py-16 px-6 bg-brand-surface rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold text-brand-on-surface-primary">Выберите регионы для анализа</h2>
                    <p className="text-brand-on-surface-secondary mt-2">Пожалуйста, выберите один или несколько регионов в фильтре выше, чтобы увидеть подробную статистику.</p>
                </div>
            );
        }

        if(noResultsFromSearch && activeTab === 'cards') {
            return (
                <div className="text-center py-16 px-6 bg-brand-surface rounded-2xl shadow-sm">
                    <h2 className="text-xl font-bold text-brand-on-surface-primary">Регион не найден</h2>
                    <p className="text-brand-on-surface-secondary mt-2">По вашему запросу "{searchQuery}" ничего не найдено. Попробуйте изменить поисковый запрос.</p>
                </div>
            )
        }


        return (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {aggregatedData.map(({ region, stats, comparisonData }, index) => (
                     <motion.div
                        layout="position"
                        key={region}
                        className="h-full"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                        initial={enableAnimation ? "hidden" : "visible"}
                        whileInView={enableAnimation ? "visible" : "visible"}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ 
                            duration: 0.4, 
                            delay: enableAnimation ? Math.min(index * 0.07, 0.7) : 0,
                            layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } 
                        }}
                    >
                        <RegionCard region={region} stats={stats} onViewDetails={onViewDetails} comparisonData={comparisonData} />
                    </motion.div>
                ))}
            </motion.div>
        );
    };

    return (
        <div>
            <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-brand-on-surface-primary">Детальный анализ по регионам</h2>
                <div className="flex flex-wrap items-center gap-4">
                     <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Поиск по названию..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-48 bg-brand-surface text-brand-on-surface-primary placeholder:text-brand-on-surface-secondary pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
                            aria-label="Поиск по названию региона"
                        />
                    </div>
                    {activeTab === 'cards' && aggregatedData.length > 1 && (
                        <SortDropdown 
                            options={SORT_KEYS} 
                            sortKey={sortKey} 
                            onKeyChange={onSortKeyChange}
                            sortDirection={sortDirection}
                            onDirectionChange={onSortDirectionChange}
                        />
                    )}
                    <div className="flex relative">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'cards' | 'chart')}
                                className={`relative px-4 py-2 text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                                    activeTab === tab.id
                                        ? 'text-brand-primary'
                                        : 'text-brand-on-surface-secondary hover:text-brand-primary'
                                }`}
                                aria-pressed={activeTab === tab.id}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand-primary"
                                        layoutId="active-tab-indicator"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
             <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};