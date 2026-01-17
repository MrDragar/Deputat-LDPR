import React, { useState, useMemo, useEffect } from 'react';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { ChevronDown, Check, Search } from 'lucide-react';

interface CheckboxDropdownProps {
    title?: string;
    options: (string | { label: string; value: string })[];
    selectedOptions: string[];
    onChange: (newSelection: string[]) => void;
    searchable?: boolean;
}

export const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({ title, options, selectedOptions, onChange, searchable = true }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useOutsideClick<HTMLDivElement>(() => setIsOpen(false));
    
    const allOptionValues = options.map(o => typeof o === 'string' ? o : o.value);

    const handleToggle = (value: string) => {
        const newSelection = selectedOptions.includes(value)
            ? selectedOptions.filter(v => v !== value)
            : [...selectedOptions, value];
        onChange(newSelection);
    };

    const handleSelectAll = () => onChange(allOptionValues);
    const handleDeselectAll = () => onChange([]);

    const getDisplayValue = () => {
        if (selectedOptions.length === 0) return 'Не выбрано';
        if (selectedOptions.length === options.length) return 'Выбраны все';
        if (selectedOptions.length === 1) {
            const opt = options.find(o => (typeof o === 'string' ? o : o.value) === selectedOptions[0]);
            return typeof opt === 'string' ? opt : opt?.label;
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
        return options.filter(option => {
            const label = typeof option === 'string' ? option : option.label;
            return label.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [options, searchQuery]);

    const showSearch = searchable && options.length > 10;

    return (
        <div className="relative font-inter" ref={dropdownRef}>
             {title && <label className="text-sm font-semibold mb-2 text-brand-on-surface-primary block">{title}</label>}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="flex items-center justify-between w-full bg-brand-surface border border-gray-200 rounded-lg px-4 py-3 text-left transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
                <p className="font-medium text-brand-on-surface-primary">{getDisplayValue()}</p>
                <ChevronDown size={20} className={`text-brand-on-surface-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-brand-surface border border-gray-200 rounded-lg shadow-lg z-20 p-2">
                    <div className="flex justify-between px-2 pb-2 border-b border-gray-100 mb-2">
                        <button onClick={handleSelectAll} className="text-sm font-medium text-brand-primary hover:underline focus:outline-none">Выбрать все</button>
                        <button onClick={handleDeselectAll} className="text-sm font-medium text-brand-primary hover:underline focus:outline-none">Снять все</button>
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
                                    className="w-full bg-gray-100 text-sm pl-10 pr-3 py-2 border-none rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                    <ul role="listbox" className="max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 ? filteredOptions.map((option, index) => {
                            const value = typeof option === 'string' ? option : option.value;
                            const label = typeof option === 'string' ? option : option.label;
                            const isSelected = selectedOptions.includes(value);

                            return (
                                <li key={index}>
                                    <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`checkbox-${title}-${value}`}
                                                className="peer appearance-none h-5 w-5 rounded border-2 border-gray-300 checked:bg-brand-secondary checked:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary transition-all"
                                                checked={isSelected}
                                                onChange={() => handleToggle(value)}
                                            />
                                            <Check size={14} className="absolute left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-sm font-medium text-brand-on-surface-primary select-none">{label}</span>
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