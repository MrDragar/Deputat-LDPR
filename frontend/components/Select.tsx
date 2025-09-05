import React, { useState, useRef, useEffect, useCallback } from 'react';
// FIX: Changed import from 'react-dom/client' to 'react-dom' to correctly use createPortal.
import ReactDOM from 'react-dom';
import { ChevronDown, X, Check } from 'lucide-react';
import MobileSelect from './MobileSelect';

interface SelectProps {
    label: string;
    name: string;
    id?: string;
    options: string[];
    selected: string;
    onChange: (name: string, value: string) => void;
    required?: boolean;
    error?: string;
    onBlur?: (name: string) => void;
}

const Select: React.FC<SelectProps> = ({ label, name, id, options, selected, onChange, required, error, onBlur }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const handleBlur = useCallback(() => {
        if (onBlur) {
            onBlur(name);
        }
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
    
    useEffect(() => {
        if (isOpen && !isMobile && dropdownRef.current) {
            const dropdownRect = dropdownRef.current.getBoundingClientRect();
            // If dropdown bottom is below the viewport, scroll down to make it fully visible.
            if (dropdownRect.bottom > window.innerHeight) {
                dropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }
    }, [isOpen, isMobile]);

    const handleSelect = (option: string) => {
        onChange(name, option);
        setIsOpen(false);
        // FIX: Removed onBlur call. The parent's onChange handler now correctly
        // re-validates the field if it was already touched, clearing the error.
        // Calling onBlur here caused a race condition where validation ran on stale state.
    };
    
    const handleToggle = () => {
        if (isMobile) {
            setIsOpen(true);
            return;
        }

        const willBeOpen = !isOpen;
        setIsOpen(willBeOpen);
        if (!willBeOpen) {
            handleBlur();
        }
    };

    const handleMobileClose = () => {
        setIsOpen(false);
        handleBlur();
    };

    const portalRoot = document.getElementById('root');

    if (isMobile && portalRoot) {
        return (
            <>
                <label htmlFor={id || name} className="block text-base font-semibold text-gray-800 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <button
                    id={id || name}
                    type="button"
                    onClick={handleToggle}
                    className={`w-full px-4 py-3 text-left bg-white border rounded-md shadow-sm flex justify-between items-center text-base
                    focus:outline-none focus:ring-2 ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 ring-blue-500 focus:border-blue-500'}`}
                >
                    <span className={selected ? 'text-gray-900' : 'text-gray-500'}>
                        {selected || 'Выберите...'}
                    </span>
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                {isOpen && ReactDOM.createPortal(
                    <MobileSelect
                        isOpen={isOpen}
                        onClose={handleMobileClose}
                        options={options}
                        selectedOption={selected}
                        onSelect={handleSelect}
                        title={label}
                    />,
                    portalRoot
                )}
            </>
        );
    }

    return (
        <div ref={wrapperRef} className="relative">
            <label htmlFor={id || name} className="block text-base font-semibold text-gray-800 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <button
                id={id || name}
                type="button"
                onClick={handleToggle}
                className={`w-full px-4 py-3 text-left bg-white border rounded-md shadow-sm flex justify-between items-center text-base
                focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
            >
                <span className={selected ? 'text-gray-900' : 'text-gray-500'}>
                    {selected || 'Выберите...'}
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div ref={dropdownRef} className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                    <ul>
                        {options.map(option => (
                            <li
                                key={option}
                                onClick={() => handleSelect(option)}
                                className={`px-4 py-2 cursor-pointer text-gray-900 ${selected === option ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default React.memo(Select);