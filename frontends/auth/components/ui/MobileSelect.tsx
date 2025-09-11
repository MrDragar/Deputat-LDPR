import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Check, Search } from 'lucide-react';

interface MobileSelectProps {
    isOpen: boolean;
    onClose: () => void;
    options: string[];
    selectedOption: string;
    onSelect: (option: string) => void;
    title: string;
    isSearchable?: boolean;
}

const MobileSelect: React.FC<MobileSelectProps> = ({ isOpen, onClose, options, selectedOption, onSelect, title, isSearchable = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const listRef = useRef<HTMLUListElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = useMemo(() => {
        if (!isSearchable || !searchTerm) {
            return options;
        }
        return options.filter(option =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm, isSearchable]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Reset search term and scroll position when opening
            setSearchTerm('');
            setTimeout(() => {
                listRef.current?.scrollTo(0, 0);
                if (isSearchable) {
                    inputRef.current?.focus();
                }
            }, 100); // Allow time for transition
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, isSearchable]);
    
    const handleSelect = (option: string) => {
        onSelect(option);
    };

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

            {isSearchable && (
                <div className="p-4 border-b border-gray-200 sticky top-[65px] bg-white z-10 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Поиск..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-base"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <ul ref={listRef} className="flex-grow overflow-y-auto p-2">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(option => (
                        <li key={option}>
                            <button
                                onClick={() => handleSelect(option)}
                                className="w-full flex items-center justify-between text-left px-4 py-3.5 rounded-lg text-gray-800 hover:bg-gray-100"
                                role="option"
                                aria-selected={selectedOption === option}
                            >
                                <span className="text-base">{option}</span>
                                {selectedOption === option && <Check className="h-5 w-5 text-blue-600" />}
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