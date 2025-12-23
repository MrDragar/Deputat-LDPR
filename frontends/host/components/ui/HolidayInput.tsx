import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface HolidayInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const HolidayInput: React.FC<HolidayInputProps> = ({ value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const mainInputRef = useRef<HTMLInputElement>(null);

  // State for visual feedback during drag-and-drop
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Refs to store data during the drag operation
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const addHolidayFromInput = () => {
    const newHolidays = inputValue
      .split(',')
      .map(h => h.trim())
      .filter(h => h && !value.includes(h));

    if (newHolidays.length > 0) {
      onChange([...value, ...newHolidays]);
    }
    setInputValue('');
  };
  
  const removeHoliday = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addHolidayFromInput();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      const lastHoliday = value[value.length - 1];
      removeHoliday(value.length - 1);
      setInputValue(lastHoliday + ' ');
    }
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLSpanElement>, index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLSpanElement>, index: number) => {
    if (index !== dragItem.current) {
      dragOverItem.current = index;
      setDragOverIndex(index);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      return; // Do nothing if drop is invalid or on itself
    }
    
    const newHolidays = [...value];
    const dragItemContent = newHolidays.splice(dragItem.current, 1)[0];
    newHolidays.splice(dragOverItem.current, 0, dragItemContent);
    
    onChange(newHolidays);
  };

  const handleDragEnd = () => {
    handleDrop();
    // Reset all states and refs for cleanup
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div 
      className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all min-h-[48px]"
      onClick={() => mainInputRef.current?.focus()}
    >
      {value.map((holiday, index) => (
        <span
          key={holiday + index}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={handleDragLeave}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className={`
            inline-flex items-center gap-2 bg-slate-200 text-slate-800 text-sm font-medium pl-3 pr-1.5 py-1.5 rounded-md 
            animate-in fade-in-0 zoom-in-95 duration-200 cursor-grab 
            max-w-full break-words
            transition-all border-2
            ${draggingIndex === index ? 'opacity-30' : 'opacity-100'}
            ${dragOverIndex === index && draggingIndex !== index ? 'border-blue-500' : 'border-transparent'}
          `}
        >
          <span className="min-w-0">{holiday}</span>
          <button 
            type="button" 
            onClick={(e) => {
                e.stopPropagation();
                removeHoliday(index);
            }} 
            className="rounded-full text-slate-500 hover:bg-slate-300 hover:text-slate-700 p-0.5 flex-shrink-0"
            aria-label={`Удалить ${holiday}`}
          >
            <X className="h-4 w-4" />
          </button>
        </span>
      ))}
      <input
        ref={mainInputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addHolidayFromInput}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-grow bg-transparent p-1.5 focus:outline-none text-base text-gray-900 min-w-[200px]"
        aria-label="Добавить праздник"
      />
    </div>
  );
};

export default HolidayInput;
