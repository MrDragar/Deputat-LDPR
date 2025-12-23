import React, { useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

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
}

const MobileSelect: React.FC<MobileSelectProps> = ({ isOpen, onClose, options, selectedValue, onSelect, title }) => {
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                listRef.current?.scrollTo(0, 0);
            }, 100); 
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    
    const handleSelect = (value: string) => {
        onSelect(value);
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

            <ul ref={listRef} className="flex-grow overflow-y-auto scrollbar-hide p-2">
                {options.length > 0 ? (
                    options.map(option => (
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
                        Нет доступных опций
                    </li>
                )}
            </ul>
        </div>
    );
};

export default MobileSelect;