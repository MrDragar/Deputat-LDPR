import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Tooltip as RechartsTooltip, Cell, XAxis } from 'recharts';
import { CheckboxDropdown } from './CheckboxDropdown';
import type { ProcessedData, DeputyType } from '../types';
import { DEPUTY_TYPE_FILTERS } from '../constants';
import { getAppealColors } from '../utils/colorUtils';
import { Users, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface ComparisonViewProps {
    allData: ProcessedData | null;
    selectedDates: string[];
    selectedDeputyTypes: DeputyType[];
    comparisonRegions: string[];
    onRegionChange: (regions: string[]) => void;
    comparisonDataByRegion: Map<string, { change: any, comparisonPeriodLabel: string }> | null;
}

interface RegionComparisonData {
    region: string;
    stats: {
        total: number;
        interacting: number;
        reception: number;
        totalCitizens: number;
        engagement: number;
        totalByType: Record<DeputyType, number>;
        interactingByType: Record<DeputyType, number>;
        receptionByType: Record<DeputyType, number>;
    };
    historicalReception: { date: string; value: number }[];
    topAppeals: { topic: string; value: number }[];
    comparisonData: { change: any, comparisonPeriodLabel: string } | null;
}

const MetricTooltip: React.FC<{ breakdown: Record<DeputyType, number> }> = ({ breakdown }) => (
    <div className="w-auto min-w-[140px] bg-brand-surface p-2 border border-gray-200 rounded-lg shadow-xl text-xs z-20">
        <ul className="space-y-0.5 w-full">
            {DEPUTY_TYPE_FILTERS
                .filter(type => breakdown[type.value] > 0)
                .sort((a, b) => breakdown[b.value] - breakdown[a.value])
                .map(typeInfo => (
                    <li key={typeInfo.value} className="grid grid-cols-[1fr_auto] items-center px-1 gap-x-2">
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: typeInfo.color }}></span>
                            <span className="text-brand-on-surface-secondary">{typeInfo.label}</span>
                        </div>
                        <span className="font-semibold text-brand-on-surface-primary">{breakdown[typeInfo.value].toLocaleString('ru-RU')}</span>
                    </li>
                ))}
        </ul>
    </div>
);

const ChangeIndicator: React.FC<{ change: number; comparisonLabel?: string; unit?: string; showIcon?: boolean }> = ({ change, comparisonLabel, unit = '', showIcon = true }) => {
    if (change === 0 || isNaN(change)) {
        return null;
    }

    const isPositive = change > 0;
    const color = isPositive ? 'text-brand-positive' : 'text-brand-negative';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const sign = isPositive ? '+' : '-';
    const tooltipText = comparisonLabel ? `сравнение с ${comparisonLabel}` : '';

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

const EngagementTooltip: React.FC<{ stats: RegionComparisonData['stats']; comparisonData: any | null; }> = ({ stats, comparisonData }) => {
    return (
        <div className="w-auto min-w-[160px] bg-brand-surface p-2 border border-gray-200 rounded-lg shadow-lg text-sm flex flex-col justify-center text-left z-20">
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
                        const change = comparisonData?.change?.receptionByType?.[typeInfo.value] ?? 0;

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


const MetricRow: React.FC<{
    label: string;
    metricKey: keyof RegionComparisonData['stats'];
    data: RegionComparisonData[];
    isComparable: boolean;
    onHover: (metric: string, region: string | null) => void;
    hoveredMetric: { metric: string, region: string } | null;
}> = ({ label, metricKey, data, isComparable, onHover, hoveredMetric }) => {
    const values = data.map(d => d.stats[metricKey as keyof typeof d.stats] as number);
    const maxValue = useMemo(() => Math.max(...values), [values]);

    return (
        <div className="py-3 border-b border-gray-100 last:border-b-0">
            <p className="text-sm font-semibold text-brand-on-surface-secondary mb-2 text-center">{label}</p>
            <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
                {data.map((regionData) => {
                    const value = regionData.stats[metricKey as keyof typeof regionData.stats] as number;
                    const isWinner = value === maxValue && value > 0 && data.length > 1;
                    const isHovered = hoveredMetric?.metric === metricKey && hoveredMetric?.region === regionData.region;
                    
                    return (
                        <div
                            key={regionData.region}
                            className="relative text-center p-2 rounded-lg transition-colors"
                            onMouseEnter={() => isComparable && value > 0 && onHover(metricKey, regionData.region)}
                            onMouseLeave={() => isComparable && onHover(metricKey, null)}
                        >
                            <span className={`text-2xl font-bold transition-colors ${isWinner ? 'text-green-600' : 'text-brand-on-surface-primary'}`}>{value.toLocaleString('ru-RU')}</span>
                            <AnimatePresence>
                                {isComparable && isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2"
                                    >
                                        <MetricTooltip breakdown={regionData.stats[`${metricKey}ByType` as keyof typeof regionData.stats] as Record<DeputyType, number>} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const EngagementChart: React.FC<{ breakdown: Record<DeputyType, number>, rate: number }> = ({ breakdown, rate }) => {
    const chartData = useMemo(() => DEPUTY_TYPE_FILTERS
        .map(type => ({ name: type.label, value: breakdown[type.value], fill: type.color }))
        .filter(d => d.value > 0), [breakdown]);
    
    const hasData = chartData.some(d => d.value > 0);

    return (
        <div className="w-32 h-32 mx-auto relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={hasData ? chartData : [{ value: 1, fill: '#E2E8F0' }]}
                        cx="50%" cy="50%"
                        dataKey="value"
                        innerRadius={40} outerRadius={52}
                        isAnimationActive={false}
                        strokeWidth={2} stroke={"#F5F8FA"}
                    >
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        {!hasData && <Cell fill="#E2E8F0" />}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-brand-primary">{isNaN(rate) ? 0 : rate}%</span>
            </div>
        </div>
    );
};

const TopAppealsDisplay: React.FC<{ appeals: { topic: string, value: number }[], colors: Record<string, string> }> = ({ appeals, colors }) => {
    const total = useMemo(() => appeals.reduce((sum, item) => sum + item.value, 0), [appeals]);
    if (total === 0) return <div className="h-full flex items-center justify-center text-sm text-gray-400">Нет данных по обращениям</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="w-full h-3 bg-gray-200 rounded-full flex overflow-hidden my-2">
                {appeals.map(appeal => (
                    <div
                        key={appeal.topic}
                        className="h-full"
                        style={{ width: `${(appeal.value / total) * 100}%`, backgroundColor: colors[appeal.topic] }}
                        title={`${appeal.topic}: ${appeal.value.toLocaleString('ru-RU')}`}
                    />
                ))}
            </div>
            <ul className="space-y-1.5 text-xs overflow-y-auto pr-1">
                {appeals.map(appeal => (
                    <li key={appeal.topic} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[appeal.topic] }} />
                        <span className="text-brand-on-surface-secondary truncate" title={appeal.topic}>{appeal.topic}</span>
                        <span className="font-semibold text-brand-on-surface-primary">{appeal.value.toLocaleString('ru-RU')}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const formatXAxisTick = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('.')) return '';
    const [day, monthNum] = dateStr.split('.');
    const date = new Date(2025, parseInt(monthNum, 10) - 1, parseInt(day));
    return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }).replace(' г.', '').replace('.', '');
};

const RegionComparisonColumn: React.FC<{ data: RegionComparisonData; appealColors: Record<string, string>; isComparable: boolean; }> = ({ data, appealColors, isComparable }) => {
    const [isTooltipVisible, setTooltipVisible] = useState(false);
    return (
        <div className="bg-white rounded-2xl shadow-[0px_4px_16px_rgba(0,0,0,0.07)] p-4 flex flex-col h-full">
            <div className="h-16 flex items-center justify-center text-center pb-3 border-b border-gray-100">
                <h3 className="text-lg font-bold text-brand-on-surface-primary line-clamp-2">{data.region}</h3>
            </div>
            
            <div className="h-44 text-center mt-2 flex flex-col justify-center">
                <p className="text-sm font-semibold text-brand-on-surface-secondary mb-1">Вовлеченность</p>
                <div 
                    className="relative"
                    onMouseEnter={() => isComparable && setTooltipVisible(true)}
                    onMouseLeave={() => setTooltipVisible(false)}
                >
                    <EngagementChart breakdown={data.stats.receptionByType} rate={data.stats.engagement} />
                    <AnimatePresence>
                        {isTooltipVisible && (
                             <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none"
                            >
                                <EngagementTooltip stats={data.stats} comparisonData={data.comparisonData} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="h-40 mt-2">
                <p className="text-sm font-semibold text-brand-on-surface-secondary mb-2 text-center">Динамика приема граждан</p>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.historicalReception} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                         <RechartsTooltip
                            cursor={{ stroke: '#a0aec0', strokeDasharray: '3 3' }}
                            contentStyle={{ fontSize: '12px', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelFormatter={(label) => new Date(label.split('.').reverse().join('-')).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                        />
                         <XAxis
                            dataKey="date"
                            tickFormatter={formatXAxisTick}
                            tick={{ fontSize: 10, fill: '#718096' }}
                            interval="preserveStartEnd"
                            tickCount={4}
                        />
                        <Line
                            isAnimationActive={false}
                            type="monotone"
                            dataKey="value"
                            name="Принято"
                            stroke={DEPUTY_TYPE_FILTERS[2].color}
                            strokeWidth={2.5}
                            dot={{ r: 3, strokeWidth: 1, fill: '#fff' }}
                            activeDot={{ r: 5, stroke: DEPUTY_TYPE_FILTERS[2].color, fill: '#fff', strokeWidth: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex-grow mt-4 pt-3 border-t border-gray-100 min-h-[160px]">
                <p className="text-sm font-semibold text-brand-on-surface-secondary text-center">Топ-5 тем обращений</p>
                <TopAppealsDisplay appeals={data.topAppeals} colors={appealColors} />
            </div>
        </div>
    );
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({ allData, selectedDates, selectedDeputyTypes, comparisonRegions, onRegionChange, comparisonDataByRegion }) => {
    const [hoveredMetric, setHoveredMetric] = useState<{ metric: string, region: string } | null>(null);
    
    const isComparable = selectedDates.length === 1;

    const handleRegionChange = (newSelection: string[]) => {
        if (newSelection.length <= 4) {
            onRegionChange(newSelection);
        }
    };
    
    const { comparisonData, appealColors } = useMemo(() => {
        if (!allData) return { comparisonData: [], appealColors: {} };

        const allAppealTopics = allData.appealTopics;
        const colors = getAppealColors(allAppealTopics);

        const data = comparisonRegions.map(regionName => {
            const stats = { total: 0, interacting: 0, reception: 0, totalCitizens: 0, engagement: 0, totalByType: { zs: 0, acs: 0, omsu: 0 }, interactingByType: { zs: 0, acs: 0, omsu: 0 }, receptionByType: { zs: 0, acs: 0, omsu: 0 } };
            const appeals: Record<string, number> = {};
            
            selectedDates.forEach(date => {
                const regionData = allData.dataByDate[date]?.statisticsByRegion[regionName];
                if (regionData) {
                    stats.totalCitizens += regionData.totalCitizens;
                    selectedDeputyTypes.forEach(type => {
                        stats.total += regionData.data[type]?.total ?? 0;
                        stats.interacting += regionData.data[type]?.interacting ?? 0;
                        stats.reception += regionData.data[type]?.reception ?? 0;
                        stats.totalByType[type] += regionData.data[type]?.total ?? 0;
                        stats.interactingByType[type] += regionData.data[type]?.interacting ?? 0;
                        stats.receptionByType[type] += regionData.data[type]?.reception ?? 0;
                    });
                     Object.entries(regionData.appeals).forEach(([topic, count]) => {
                        appeals[topic] = (appeals[topic] || 0) + count;
                    });
                }
            });
            stats.engagement = stats.interacting > 0 ? Math.round((stats.reception / stats.interacting) * 100) : 0;
            
            const historicalReception = allData.dateOptions.map(d => ({ date: d.value, value: allData.dataByDate[d.value]?.statisticsByRegion[regionName]?.totalCitizens ?? 0 }));
            
            const topAppeals = Object.entries(appeals).map(([topic, value]) => ({ topic, value })).sort((a, b) => b.value - a.value).slice(0, 5);
            
            const comparisonInfo = comparisonDataByRegion?.get(regionName) || null;

            return { region: regionName, stats, historicalReception, topAppeals, comparisonData: comparisonInfo };
        });

        return { comparisonData: data, appealColors: colors };

    }, [allData, selectedDates, selectedDeputyTypes, comparisonRegions, comparisonDataByRegion]);

    const metricsToCompare = [
        { label: 'Всего депутатов', key: 'total' },
        { label: 'Взаимодействующих', key: 'interacting' },
        { label: 'Провели прием', key: 'reception' },
        { label: 'Принято граждан', key: 'totalCitizens' },
    ];
    
    const handleHover = (metric: string, region: string | null) => {
        if (region) {
            setHoveredMetric({ metric, region });
        } else {
            setHoveredMetric(null);
        }
    };

    return (
        <div className="bg-brand-background/70 p-4 sm:p-6 rounded-2xl">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-brand-on-surface-primary">Инструмент сравнения регионов</h3>
                    <p className="text-brand-on-surface-secondary mt-1">Выберите от 2 до 4 регионов для детального сопоставления.</p>
                </div>
                <div className="w-full md:w-80">
                    <CheckboxDropdown
                        options={allData?.regionOptions ?? []}
                        selectedOptions={comparisonRegions}
                        onChange={handleRegionChange}
                    />
                </div>
            </div>

            <AnimatePresence>
                {comparisonRegions.length < 2 && (
                     <motion.div
                        key="placeholder"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`text-center py-16 px-6 rounded-2xl border-2 border-dashed ${comparisonRegions.length === 1 ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50'}`}
                    >
                        {comparisonRegions.length === 1 ? <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" /> : <Users size={48} className="mx-auto text-gray-400 mb-4" />}
                        <h2 className={`text-xl font-bold ${comparisonRegions.length === 1 ? 'text-yellow-800' : 'text-brand-on-surface-primary'}`}>
                           {comparisonRegions.length === 1 ? 'Нужен еще один регион' : 'Начните сравнение'}
                        </h2>
                        <p className={`${comparisonRegions.length === 1 ? 'text-yellow-700' : 'text-brand-on-surface-secondary'} mt-2`}>
                            {comparisonRegions.length === 1 ? 'Выберите как минимум два региона для начала сравнения.' : 'Пожалуйста, выберите два или более регионов в списке выше.'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {comparisonRegions.length >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
                         {metricsToCompare.map(metric => (
                            <MetricRow
                                key={metric.key}
                                label={metric.label}
                                metricKey={metric.key as keyof RegionComparisonData['stats']}
                                data={comparisonData}
                                isComparable={isComparable && metric.key !== 'totalCitizens'}
                                onHover={handleHover}
                                hoveredMetric={hoveredMetric}
                            />
                        ))}
                    </div>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${comparisonRegions.length} gap-6`}>
                        {comparisonData.map(data => (
                            <RegionComparisonColumn key={data.region} data={data} appealColors={appealColors} isComparable={isComparable}/>
                        ))}
                    </div>
                </motion.div>
            )}

        </div>
    );
};