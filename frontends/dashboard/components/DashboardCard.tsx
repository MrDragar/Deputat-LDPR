import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DashboardCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    colorClass: string;
    change?: number;
    comparisonLabel?: string;
    onActionClick?: () => void;
    actionIcon?: React.ReactNode;
}

const ChangeIndicator: React.FC<{ change: number; comparisonLabel?: string }> = ({ change, comparisonLabel }) => {
    if (change === 0 || isNaN(change)) {
        return <span className="text-sm font-medium text-gray-500 ml-2">0</span>;
    }

    const isPositive = change > 0;
    const color = isPositive ? 'text-brand-positive' : 'text-brand-negative';
    const Icon = isPositive ? ArrowUp : ArrowDown;
    const sign = isPositive ? '+' : '';
    const tooltipText = comparisonLabel ? `сравнение с ${comparisonLabel}` : '';

    return (
        <span className="relative group flex items-center text-sm font-semibold ml-2">
            <span className={`flex items-center ${color}`}>
                <Icon size={14} className="mr-0.5" />
                {sign}{Math.abs(change).toLocaleString('ru-RU')}
            </span>
             {tooltipText && (
                 <div
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-solid after:border-transparent after:border-t-gray-800"
                >
                    {tooltipText}
                </div>
            )}
        </span>
    );
};


export const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, colorClass, change, comparisonLabel, onActionClick, actionIcon }) => {
    return (
        <div className="bg-brand-surface p-6 rounded-2xl shadow-[0px_4px_12px_rgba(0,0,0,0.05)] grid grid-cols-[auto_1fr] gap-x-4 items-start relative">
             {onActionClick && actionIcon && (
                <button 
                    onClick={onActionClick} 
                    className="absolute top-6 right-6 h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-brand-primary hover:scale-110 hover:bg-gray-50 transition-all duration-200"
                    aria-label="Перейти к детальной статистике"
                >
                    {actionIcon}
                </button>
            )}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <div className={`min-w-0 ${onActionClick ? 'pr-10' : ''}`}>
                <p className="text-sm text-brand-on-surface-secondary min-h-[2.5rem] whitespace-pre-line">{title}</p>
                 <div className="flex items-baseline mt-1">
                    <p className="text-3xl font-semibold text-brand-on-surface-primary">{value}</p>
                    {change !== undefined && change !== null && <ChangeIndicator change={change} comparisonLabel={comparisonLabel} />}
                </div>
            </div>
        </div>
    );
};