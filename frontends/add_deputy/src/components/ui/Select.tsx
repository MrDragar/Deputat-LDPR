import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import MobileSelect from './MobileSelect';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    name: string;
    id?: string;
    options: SelectOption[];
    value: string;
    onChange: (name: string, value: string) => void;
    onBlur?: (name: string) => void;
    error?: string;
    required?: boolean;
    icon?: React.ReactNode;
    searchable?: boolean;
}

const Select: React.FC<SelectProps> = ({ label, name, id, options, value, onChange, onBlur, error, required, icon, searchable = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedLabel = useMemo(() => {
        return options.find(option => option.value === value)?.label || 'Выберите...';
    }, [options, value]);

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchQuery) return options;
        return options.filter(option => 
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [options, searchQuery, searchable]);

     useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const handleBlur = useCallback(() => {
        if (onBlur) onBlur(name);
    }, [name, onBlur]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                if (isOpen) {
                    setIsOpen(false);
                    handleBlur();
                }
            }
        };
        if (!isMobile) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            if (!isMobile) {
                document.removeEventListener('mousedown', handleClickOutside);
            }
        };
    }, [isOpen, handleBlur, wrapperRef, isMobile]);

    const handleSelect = (optionValue: string) => {
        onChange(name, optionValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleToggle = () => {
        const willBeOpen = !isOpen;
        setIsOpen(willBeOpen);
        if (!willBeOpen) handleBlur();
        if (willBeOpen) setSearchQuery('');
    };
    
    const handleMobileClose = () => {
        setIsOpen(false);
        handleBlur();
        setSearchQuery('');
    };

    const portalRoot = document.getElementById('root');

    if (isMobile && portalRoot) {
        return (
             <div className="relative">
                {label && (
                  <label htmlFor={id || name} className="block text-base font-semibold text-gray-800 mb-2">
                      {label} {required && <span className="text-red-500">*</span>}
                  </label>
                )}
                <div className="relative">
                  {icon && (
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                          {icon}
                      </div>
                  )}
                  <button
                      id={id || name}
                      type="button"
                      onClick={() => setIsOpen(true)}
                      className={`w-full py-3 pr-4 text-left bg-white border rounded-md shadow-sm flex justify-between items-center text-base
                      focus:outline-none focus:ring-2 ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 ring-blue-500 focus:border-blue-500'} ${icon ? 'pl-12' : 'pl-4'}`}
                  >
                      <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                          {selectedLabel}
                      </span>
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                
                {isOpen && createPortal(
                    <MobileSelect
                        isOpen={isOpen}
                        onClose={handleMobileClose}
                        options={options}
                        selectedValue={value}
                        onSelect={handleSelect}
                        title={label || 'Выберите значение'}
                        searchable={searchable}
                    />,
                    portalRoot
                )}
            </div>
        );
    }

    return (
        <div ref={wrapperRef} className="relative">
            {label && (
              <label htmlFor={id || name} className="block text-base font-semibold text-gray-800 mb-2">
                  {label} {required && <span className="text-red-500">*</span>}
              </label>
            )}
            <div className="relative">
                 {icon && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        {icon}
                    </div>
                )}
                <button
                    id={id || name}
                    type="button"
                    onClick={handleToggle}
                    className={`w-full py-3 pr-4 text-left bg-white border rounded-md shadow-sm flex justify-between items-center text-base
                    focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} ${icon ? 'pl-12' : 'pl-4'}`}
                >
                    <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedLabel}
                    </span>
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                </button>
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-[60vh] flex flex-col">
                        {searchable && (
                            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Поиск..."
                                        className="w-full bg-gray-50 text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}
                        <ul className="overflow-y-auto custom-scrollbar">
                            {filteredOptions.length > 0 ? filteredOptions.map(option => (
                                <li
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`px-4 py-2 cursor-pointer text-gray-900 ${value === option.value ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}
                                >
                                    {option.label}
                                </li>
                            )) : (
                                <li className="px-4 py-4 text-center text-sm text-gray-500">Ничего не найдено</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
             {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default React.memo(Select);