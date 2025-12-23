
import React from 'react';
import { RECEPTION_DAYS_CONFIG } from '../constants';
import type { CitizenReceptions } from '../types';

interface MonthSelectorProps {
    value: CitizenReceptions;
    onChange: (key: keyof CitizenReceptions, isActive: boolean) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ value, onChange }) => {
    const selectedCount = Object.values(value).filter(val => val === 1).length;
    const totalCount = RECEPTION_DAYS_CONFIG.length;

    return (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <h4 className="font-bold text-gray-800 text-base">Дни приема граждан</h4>
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-sm font-medium bg-gray-100 text-gray-600">
                    {selectedCount}/{totalCount}
                </span>
            </div>
             <p className="text-sm text-gray-500 mb-4">
                Выберите дни, в которые проводились приемы
            </p>
            <div className="flex flex-wrap gap-3">
                {RECEPTION_DAYS_CONFIG.map((item) => {
                    const isSelected = (value as any)[item.key] === 1;
                    return (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onChange(item.key as keyof CitizenReceptions, !isSelected)}
                            className={`
                                flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
                                ${isSelected 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(MonthSelector);
