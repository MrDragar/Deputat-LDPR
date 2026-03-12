import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Check, Search } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface MobileSelectProps {
    isOpen: boolean;
    onClose: () => void;
    options: SelectOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
    title: string;
    searchable?: boolean;
}

const MobileSelect: React.FC<MobileSelectProps> = ({ isOpen, onClose, options, selectedValue, onSelect, title, searchable = false }) => {
    const listRef = useRef<HTMLUListElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                listRef.current?.scrollTo(0, 0);
            }, 100); 
        } else {
            document.body.style.overflow = '';
            setSearchQuery('');
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    
    const handleSelect = (value: string) => {
        onSelect(value);
    };

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchQuery) return options;
        return options.filter(option => 
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [options, searchQuery, searchable]);

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col bg-white transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-select-title"
        >
            <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10 shrink-0">
                <h2 id="mobile-select-title" className="text-lg font-bold text-gray-900 truncate">
                    {title}
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Закрыть"
                >
                    <X className="h-6 w-6" />
                </button>
            </header>

            {searchable && (
                <div className="p-4 border-b border-gray-100 shrink-0">
                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Поиск..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-none rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        />
                    </div>
                </div>
            )}

            <ul ref={listRef} className="flex-grow overflow-y-auto scrollbar-hide p-2">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                        <li key={option.value}>
                            <button
                                onClick={() => handleSelect(option.value)}
                                className="w-full flex items-center justify-between text-left px-4 py-3.5 rounded-lg text-gray-800 hover:bg-gray-100"
                                role="option"
                                aria-selected={selectedValue === option.value}
                            >
                                <span className="text-base">{option.label}</span>
                                {selectedValue === option.value && <Check className="h-5 w-5 text-blue-600" />}
                            </button>
                        </li>
                    ))
                ) : (
                    <li className="px-4 py-8 text-center text-gray-500">
                        Ничего не найдено
                    </li>
                )}
            </ul>
        </div>
    );
};

export default MobileSelect;