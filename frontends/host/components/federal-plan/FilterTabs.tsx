
import React from 'react';
import type { PartyImage } from '../../data/federalPlanData';
import { partyImageConfig } from '../../data/federalPlanData';

interface FilterTabsProps {
    activeFilter: PartyImage | 'all';
    setActiveFilter: (filter: PartyImage | 'all') => void;
    counts: Record<PartyImage | 'all', number>;
}

const filters = [
    { value: 'all' as const, label: 'Все' },
    ...Object.entries(partyImageConfig).map(([image, config]) => ({
        value: image as PartyImage,
        label: config.label,
    }))
];

const FilterTabs: React.FC<FilterTabsProps> = ({ activeFilter, setActiveFilter, counts }) => {
    return (
        <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 pb-1">
                {filters.map(filter => {
                    const count = counts[filter.value];
                    const isSelected = activeFilter === filter.value;
                    
                    let activeClasses = '';
                    if (isSelected) {
                        if (filter.value === 'all') {
                            activeClasses = 'bg-blue-600 text-white';
                        } else {
                            activeClasses = `${partyImageConfig[filter.value].colors.bg} text-white`;
                        }
                    } else {
                        activeClasses = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
                    }

                    return (
                        <button
                            key={filter.value}
                            onClick={() => setActiveFilter(filter.value)}
                            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors duration-200 ${activeClasses}`}
                        >
                            {filter.label}
                            {typeof count === 'number' && (
                                <span
                                    className={`ml-2 text-xs font-semibold rounded-full flex items-center justify-center px-2 py-0.5 transition-colors duration-200 ${
                                        isSelected
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

export default FilterTabs;
