import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { ChevronDown, Check, Search } from 'lucide-react';

interface CheckboxDropdownProps {
    title?: string;
    options: string[];
    selectedOptions: string[];
    onChange: (newSelection: string[]) => void;
    searchable?: boolean;
    className?: string;
    counts?: Record<string, number>;
}

const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({ title, options, selectedOptions, onChange, searchable = true, className, counts }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useOutsideClick(dropdownRef, () => setIsOpen(false));
    
    const handleToggle = (value: string) => {
        const newSelection = selectedOptions.includes(value)
            ? selectedOptions.filter(v => v !== value)
            : [...selectedOptions, value];
        onChange(newSelection);
    };

    const handleSelectAll = () => onChange(options);
    const handleDeselectAll = () => onChange([]);

    const getDisplayValue = () => {
        if (selectedOptions.length === 0) return 'Не выбрано';
        if (selectedOptions.length === options.length) return 'Выбраны все';
        if (selectedOptions.length === 1) {
            return selectedOptions[0];
        }
        return `${selectedOptions.length} выбрано`;
    };

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options;
        return options.filter(option => 
            option.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [options, searchQuery]);

    const showSearch = searchable && options.length > 10;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
             {title && <label className="block text-base font-semibold text-gray-800 mb-2">{title}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="flex items-center justify-between w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <p className="text-base font-medium text-gray-800">{getDisplayValue()}</p>
                <ChevronDown size={20} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
                    <div className="flex justify-between px-2 pb-2 border-b border-gray-100 mb-2">
                        <button onClick={handleSelectAll} className="text-sm font-medium text-blue-600 hover:underline focus:outline-none">Выбрать все</button>
                        <button onClick={handleDeselectAll} className="text-sm font-medium text-blue-600 hover:underline focus:outline-none">Снять все</button>
                    </div>
                     {showSearch && (
                        <div className="px-2 mb-2">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search size={18} className="text-gray-400" />
                                </span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Поиск..."
                                    className="w-full bg-gray-100 text-gray-900 text-sm pl-10 pr-3 py-2 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                    <ul role="listbox" className="max-h-60 overflow-y-auto pr-1">
                        {filteredOptions.length > 0 ? filteredOptions.map((option, index) => {
                            const isSelected = selectedOptions.includes(option);
                            return (
                                <li key={index}>
                                    <label className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`checkbox-${title}-${option}`}
                                                    className="peer appearance-none h-5 w-5 rounded border-2 border-gray-300 checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all"
                                                    checked={isSelected}
                                                    onChange={() => handleToggle(option)}
                                                />
                                                <Check size={14} className="absolute left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-800 select-none">{option}</span>
                                        </div>
                                        {counts && typeof counts[option] === 'number' && (
                                            <span className="text-xs font-medium text-gray-500">
                                                ({counts[option]})
                                            </span>
                                        )}
                                    </label>
                                </li>
                            );
                        }) : (
                            <li className="p-2 text-center text-sm text-gray-500">Ничего не найдено</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CheckboxDropdown;