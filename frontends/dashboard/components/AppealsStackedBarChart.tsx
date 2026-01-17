import React, { useMemo, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Rectangle } from 'recharts';
import { Sigma } from 'lucide-react';
import { Modal } from './Modal';
import type { ChartDataItem } from '../types';

interface AppealsStackedBarChartProps {
    chartData: ChartDataItem[];
    topics: string[];
    colors: Record<string, string>;
    title: string;
    subtitle: string;
    headerControls?: React.ReactNode;
}

const formatXAxisTick = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('.')) return dateStr;
    const [day, monthNum] = dateStr.split('.');
    const date = new Date(2025, parseInt(monthNum, 10) - 1, parseInt(day));
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace(' г.', '').replace('.', '');
};

const formatTooltipLabel = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('.')) return dateStr;
    const [day, monthNum, year] = dateStr.split('.');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, parseInt(day));
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

const CustomTooltipContent: React.FC<any> = ({ active, payload, label, hoveredTopic }) => {
    if (active && payload && payload.length) {
        const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
        const total = sortedPayload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="p-3 bg-brand-surface border border-gray-200 rounded-lg shadow-lg w-72">
          <p className="font-bold text-brand-on-surface-primary mb-1 text-sm">{formatTooltipLabel(label)}</p>
          <ul className="space-y-0.5">
            {sortedPayload.map((entry: any, index: number) => {
                const isHovered = entry.name === hoveredTopic;
                return (
                  <li key={`item-${index}`} className={`grid grid-cols-[1fr_auto] items-center gap-x-3 text-xs p-1 -m-1 rounded-md transition-colors ${isHovered ? 'bg-brand-primary/10' : ''}`}>
                    <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: entry.color }}></span>
                        <span className={`text-brand-on-surface-secondary ${isHovered ? 'font-semibold' : ''}`}>{entry.name}</span>
                    </div>
                    <span className={`font-semibold text-right text-brand-on-surface-primary ${isHovered ? 'text-brand-primary' : ''}`}>{entry.value.toLocaleString('ru-RU')}</span>
                  </li>
                );
            })}
             <li className="flex items-center justify-between border-t border-gray-100 mt-1.5 pt-1.5 font-bold text-sm">
                <span className="text-brand-on-surface-secondary mr-2">Всего</span>
                <span className="text-brand-on-surface-primary">{total.toLocaleString('ru-RU')}</span>
             </li>
          </ul>
        </div>
      );
    }
    return null;
};

const CustomLegend = ({ payload, colors }: any) => {
    return (
        <div className="w-full mt-4">
            <div className="max-h-24 overflow-y-auto flex flex-wrap justify-center gap-x-3 gap-y-1">
                 {payload.map((entry: any, index: number) => {
                    const { value } = entry;
                    return (
                        <div
                            key={`item-${index}`}
                            className="flex items-center text-xs p-1 rounded-md"
                        >
                            <span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colors[value] }}></span>
                            <span className="text-brand-on-surface-secondary">{value}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const AppealsStackedBarChart: React.FC<AppealsStackedBarChartProps> = ({ chartData, topics, colors, title, subtitle, headerControls }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
    
    const handleTopicHover = useCallback((topic: string | null) => {
        setHoveredTopic(topic);
    }, []);

    const summaryData = useMemo(() => {
        const totals: Record<string, number> = {};
        topics.forEach(topic => totals[topic] = 0);
        
        chartData.forEach(period => {
            topics.forEach(topic => {
                totals[topic] += (period[topic] as number) || 0;
            });
        });
        
        return Object.entries(totals)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
            
    }, [chartData, topics]);

    const grandTotal = useMemo(() => {
        return summaryData.reduce((sum, item) => sum + item.value, 0);
    }, [summaryData]);
    
    const yAxisDomainMax = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return 1000; // Default height if no data
        }
        const maxTotal = Math.max(
            ...chartData.map(dataPoint =>
                topics.reduce((sum, topic) => sum + (Number(dataPoint[topic]) || 0), 0)
            )
        );
        if (maxTotal === 0) {
            return 100; // Avoid a domain of [0, 0]
        }
        // Add ~10% padding and round up to the next nice number (e.g., 50) for a tighter fit.
        return Math.ceil((maxTotal * 1.1) / 50) * 50;
    }, [chartData, topics]);

    return (
         <div className="bg-brand-surface p-6 rounded-2xl shadow-[0px_4px_12px_rgba(0,0,0,0.05)]">
            <header className="flex flex-wrap justify-between items-end mb-6 gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-brand-on-surface-primary">{title}</h3>
                    <p className="text-sm text-brand-on-surface-secondary mt-1">{subtitle}</p>
                </div>
                 <div className="flex items-end gap-4">
                    {headerControls}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-3 py-2 rounded-lg transition-colors"
                        aria-label="Показать итоговую сумму по темам"
                    >
                        <Sigma size={16} />
                        <span>Итоги</span>
                    </button>
                </div>
            </header>
            <div className="h-[600px] w-full">
                <ResponsiveContainer>
                    <BarChart
                        data={chartData}
                        barCategoryGap="60%"
                        margin={{
                            top: 5, right: 30, left: 20, bottom: 25,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            dataKey="date" 
                            interval="preserveStartEnd" 
                            tick={{ fontSize: 12, fill: '#718096' }} 
                            tickFormatter={formatXAxisTick}
                        >
                        </XAxis>
                        <YAxis tick={{ fontSize: 12, fill: '#718096' }} domain={[0, yAxisDomainMax]} />
                        <Tooltip animationDuration={0} content={(props) => <CustomTooltipContent {...props} hoveredTopic={hoveredTopic} />} cursor={{ fill: '#F5F8FA' }} />
                        {topics.map(topic => (
                            <Bar 
                                key={topic} 
                                dataKey={topic} 
                                stackId="a" 
                                fill={colors[topic]} 
                                name={topic} 
                                onMouseEnter={() => handleTopicHover(topic)}
                                onMouseLeave={() => handleTopicHover(null)}
                                isAnimationActive={false}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <CustomLegend 
                payload={topics.map(t => ({ value: t, type: 'circle', id: t, color: colors[t] }))}
                colors={colors}
             />
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Суммарные показатели по темам обращений">
                 <ul className="space-y-3">
                    {summaryData.map(({ name, value }) => (
                        <li key={name} className="flex items-center justify-between text-sm pb-2 border-b border-gray-100 last:border-b-0">
                             <div className="flex items-center">
                                <span className="w-2.5 h-2.5 rounded-full mr-3 shrink-0" style={{ backgroundColor: colors[name] }}></span>
                                <span className="text-brand-on-surface-secondary">{name}</span>
                            </div>
                            <span className="font-bold text-brand-on-surface-primary text-lg">{value.toLocaleString('ru-RU')}</span>
                        </li>
                    ))}
                </ul>
                 <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-bold text-brand-on-surface-primary">Итого</span>
                    <span className="text-2xl font-bold text-brand-primary">{grandTotal.toLocaleString('ru-RU')}</span>
                </div>
            </Modal>
        </div>
    );
};