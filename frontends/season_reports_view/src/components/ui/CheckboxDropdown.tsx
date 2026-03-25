import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface CheckboxDropdownProps {
  title?: string;
  options: string[];
  selectedOptions: string[];
  onChange: (newSelection: string[]) => void;
  searchable?: boolean;
  className?: string;
  counts?: Record<string, number>;
  placeholder?: string;
}

const CheckboxDropdown: React.FC<CheckboxDropdownProps> = ({ title, options, selectedOptions, onChange, searchable = true, className, counts, placeholder = 'Не выбрано' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');

  useOutsideClick(dropdownRef, () => !isMobile && setIsOpen(false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, isMobile]);

  const handleToggle = (value: string) => {
    const newSelection = selectedOptions.includes(value)
      ? selectedOptions.filter(v => v !== value)
      : [...selectedOptions, value];
    onChange(newSelection);
  };

  const handleSelectAll = () => onChange(options);
  const handleDeselectAll = () => onChange([]);

  const getDisplayValue = () => {
    if (selectedOptions.length === 0) return placeholder;
    if (selectedOptions.length === options.length) return 'Выбраны все';
    if (selectedOptions.length === 1) return selectedOptions[0];
    return `${selectedOptions.length} выбрано`;
  };

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(option => 
      option.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const portalRoot = document.getElementById('add-deputy-root');

  const renderListItems = (mobile: boolean) => (
    filteredOptions.length > 0 ? filteredOptions.map((option, index) => {
      const isSelected = selectedOptions.includes(option);
      return (
        <li key={index}>
          <label className={`flex items-center justify-between cursor-pointer transition-colors ${mobile ? 'py-3.5 px-2 border-b border-gray-100 active:bg-gray-50' : 'p-2 rounded-md hover:bg-gray-50'}`}>
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="peer appearance-none h-5 w-5 rounded border-2 border-gray-300 checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition-all"
                  checked={isSelected}
                  onChange={() => handleToggle(option)}
                />
                <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className="text-base font-medium text-gray-900 select-none leading-tight">{option}</span>
            </div>
            {counts && typeof counts[option] === 'number' && (
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ml-3 ${counts[option] > 0 ? 'bg-gray-100 text-gray-800' : 'bg-red-600 text-white'}`}>
                {counts[option]}
              </span>
            )}
          </label>
        </li>
      );
    }) : (
      <li className="p-8 text-center text-sm text-gray-500">Ничего не найдено</li>
    )
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {title && <label className="block text-base font-semibold text-gray-800 mb-2">{title}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full h-[42px] bg-white border border-gray-300 rounded-lg px-4 text-left transition-all hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${selectedOptions.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}
      >
        <span className="text-base truncate pr-2">
          {getDisplayValue()}
        </span>
        <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen && !isMobile ? 'rotate-180' : ''}`} />
      </button>

      {/* Desktop Dropdown */}
      {isOpen && !isMobile && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 min-w-[300px] animate-in fade-in zoom-in-95 duration-100">
          <div className="flex justify-between px-2 pb-2 border-b border-gray-100 mb-2">
            <button onClick={handleSelectAll} className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer">Выбрать все</button>
            <button onClick={handleDeselectAll} className="text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer">Снять все</button>
          </div>
          {searchable && (
            <div className="px-2 mb-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full bg-gray-50 text-sm pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-300"
                />
              </div>
            </div>
          )}
          <ul className="max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {renderListItems(false)}
          </ul>
        </div>
      )}

      {/* Mobile Fullscreen Modal */}
      {isOpen && isMobile && portalRoot && createPortal(
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-gray-900">{title || 'Выберите регионы'}</h2>
            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 rounded-full bg-gray-100 active:bg-gray-200 cursor-pointer">
              <X className="h-6 w-6" />
            </button>
          </header>
          
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-3">
            <button onClick={handleSelectAll} className="flex-1 py-2.5 bg-white border border-blue-200 text-blue-600 text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-transform cursor-pointer">Выбрать все</button>
            <button onClick={handleDeselectAll} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-500 text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-transform cursor-pointer">Снять все</button>
          </div>

          {searchable && (
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию..."
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-none rounded-2xl text-base focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex-grow overflow-y-auto px-4">
            <ul className="divide-y divide-gray-50">
              {renderListItems(true)}
            </ul>
          </div>

          <footer className="p-4 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)] sticky bottom-0">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-lg cursor-pointer"
            >
              Применить ({selectedOptions.length})
            </button>
          </footer>
        </div>,
        portalRoot
      )}
    </div>
  );
};

export default CheckboxDropdown;
