import React, { useState } from 'react';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { ChevronDown, ArrowDownWideNarrow, ArrowUpWideNarrow, Check, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';

interface SortOption {
    value: string;
    label: string;
    icon: React.ReactNode;
}

interface SortDropdownProps {
    options: SortOption[];
    sortKey: string;
    onKeyChange: (value: string) => void;
    sortDirection: 'asc' | 'desc';
    onDirectionChange: (direction: 'asc' | 'desc') => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ options, sortKey, onKeyChange, sortDirection, onDirectionChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useOutsideClick<HTMLDivElement>(() => setIsOpen(false));

    const selectedOption = options.find(opt => opt.value === sortKey) || options[0];
    
    const handleKeySelect = (newKey: string) => {
        onKeyChange(newKey);
        // If switching to a non-region sort, default to descending
        if (sortKey === 'region' && newKey !== 'region') {
            onDirectionChange('desc');
        }
        setIsOpen(false);
    };

    const isRegionSort = sortKey === 'region';

    return (
        <div className="relative font-inter" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="flex items-center space-x-2 bg-brand-surface border border-gray-200 rounded-lg px-3 py-2 text-left transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
                {selectedOption.icon}
                <span className="text-sm font-medium text-brand-on-surface-primary">{selectedOption.label}</span>
                <ChevronDown size={16} className={`text-brand-on-surface-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-brand-surface border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="grid grid-cols-2 gap-1 p-1">
                        <button
                            onClick={() => onDirectionChange('desc')}
                            aria-pressed={sortDirection === 'desc'}
                            className={`flex items-center justify-center space-x-2 w-full px-3 py-2 text-sm rounded-md transition-colors font-medium ${
                                sortDirection === 'desc' ? 'bg-brand-primary text-white shadow' : 'bg-gray-100 text-brand-on-surface-secondary hover:bg-gray-200'
                            }`}
                        >
                            {isRegionSort ? <ArrowUpAZ size={14} /> : <ArrowDownWideNarrow size={14} />}
                            <span>{isRegionSort ? 'Я-А' : 'По убыванию'}</span>
                        </button>
                        <button
                           onClick={() => onDirectionChange('asc')}
                           aria-pressed={sortDirection === 'asc'}
                           className={`flex items-center justify-center space-x-2 w-full px-3 py-2 text-sm rounded-md transition-colors font-medium ${
                                sortDirection === 'asc' ? 'bg-brand-primary text-white shadow' : 'bg-gray-100 text-brand-on-surface-secondary hover:bg-gray-200'
                           }`}
                        >
                            {isRegionSort ? <ArrowDownAZ size={14} /> : <ArrowUpWideNarrow size={14} />}
                            <span>{isRegionSort ? 'А-Я' : 'По возрастанию'}</span>
                        </button>
                    </div>
                    <div className="h-px bg-gray-100 my-1" role="separator" />
                    <ul role="listbox" className="p-1">
                        {options.map((option) => (
                            <li key={option.value}>
                                <button
                                    onClick={() => handleKeySelect(option.value)}
                                    className={`flex items-center justify-between w-full p-2 rounded-md text-left transition-colors text-brand-on-surface-primary ${
                                        sortKey === option.value ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-100'
                                    }`}
                                     aria-selected={sortKey === option.value}
                                     role="option"
                                >
                                    <span className="flex items-center space-x-2 text-sm">
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </span>
                                    {sortKey === option.value && <Check size={16} className="text-brand-primary" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};