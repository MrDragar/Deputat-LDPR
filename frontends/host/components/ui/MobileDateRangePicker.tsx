import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
// FIX: `subMonths` was not found in the main export, so it's imported directly from its subpath.
import { addMonths } from 'date-fns';
import subMonths from 'date-fns/subMonths';
import { Calendar, DateRange } from './Calendar';

interface MobileDateRangePickerProps {
    isOpen: boolean;
    onClose: () => void;
    date: DateRange | undefined;
    onApply: (date: DateRange | undefined) => void;
}

const MobileDateRangePicker: React.FC<MobileDateRangePickerProps> = ({ isOpen, onClose, date, onApply }) => {
    const [tempDate, setTempDate] = useState<DateRange | undefined>(date);
    const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTempDate(date); // Reset to parent's state when opening
            
            const startMonth = date?.from || new Date();
            const initialMonths = Array.from({ length: 12 }, (_, i) => addMonths(startMonth, i - 3)); // 3 before, 9 after
            setVisibleMonths(initialMonths);

            document.body.style.overflow = 'hidden';
            
             // Scroll to current month after render
            setTimeout(() => {
                const container = scrollContainerRef.current;
                if (container) {
                    // 3rd element is the first month of the initial "after" list
                    const targetChild = container.children[3] as HTMLElement;
                    if (targetChild) {
                        // Position it not at the very top, but with some offset
                        container.scrollTop = targetChild.offsetTop - container.offsetTop - 24;
                    }
                }
            }, 100);

        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, date]);

    const handleApply = () => {
        onApply(tempDate);
        onClose();
    };
    
    const handleDayClick = (day: Date) => {
      if (tempDate?.from && !tempDate.to && day.getTime() === tempDate.from.getTime()) {
          setTempDate(undefined);
      } else if (tempDate?.from && tempDate.to && (day.getTime() === tempDate.from.getTime() || day.getTime() === tempDate.to.getTime())) {
          const newSingleDate = day.getTime() === tempDate.from.getTime() ? tempDate.to : tempDate.from;
          setTempDate({ from: newSingleDate, to: undefined });
      } else {
          const newRange = tempDate ? { from: tempDate.from, to: tempDate.to } : { from: undefined, to: undefined };
          if (!newRange.from || newRange.to) {
              newRange.from = day;
              newRange.to = undefined;
          } else {
              if (day < newRange.from) {
                  newRange.to = newRange.from;
                  newRange.from = day;
              } else {
                  newRange.to = day;
              }
          }
          setTempDate(newRange);
      }
    };

    const handleScroll = useCallback(() => {
        if (isLoading || !scrollContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        
        // Load more future months
        if (scrollHeight - scrollTop < clientHeight + 400) {
            setIsLoading(true);
            setVisibleMonths(prev => {
                const lastMonth = prev[prev.length - 1];
                const newMonths = Array.from({ length: 6 }, (_, i) => addMonths(lastMonth, i + 1));
                return [...prev, ...newMonths];
            });
            setTimeout(() => setIsLoading(false), 200); // Debounce
        }
        
        // Load more past months
        if (scrollTop < 400 && visibleMonths.length > 0) {
            setIsLoading(true);
            const container = scrollContainerRef.current;
            const prevScrollHeight = container.scrollHeight;

            setVisibleMonths(prev => {
                const firstMonth = prev[0];
                const newMonths = Array.from({ length: 6 }, (_, i) => subMonths(firstMonth, 6 - i));
                return [...newMonths, ...prev];
            });
            
            // This needs to run after the DOM updates to maintain scroll position
            requestAnimationFrame(() => {
                 if (container) {
                    container.scrollTop = scrollTop + (container.scrollHeight - prevScrollHeight);
                 }
                 setIsLoading(false);
            });
        }
    }, [isLoading, visibleMonths]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    return (
        <div
            className={`fixed inset-0 z-50 flex flex-col bg-slate-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-date-picker-title"
        >
            <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10 shrink-0">
                <h2 id="mobile-date-picker-title" className="text-lg font-bold text-gray-900 truncate">
                    Выберите день или период
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Закрыть"
                >
                    <X className="h-6 w-6" />
                </button>
            </header>
            
            <div ref={scrollContainerRef} className="flex-grow overflow-y-auto scrollbar-hide p-4 space-y-6">
                 {visibleMonths.map((month) => (
                    <Calendar
                        key={month.toISOString()}
                        selected={tempDate}
                        onDayClick={handleDayClick}
                        className="p-0 border-none shadow-none max-w-none bg-transparent"
                        displayMonth={month}
                        showNavigation={false}
                    />
                 ))}
            </div>
            
            <footer className="p-4 border-t border-gray-200 sticky bottom-0 bg-white z-10 shrink-0">
                <button
                    onClick={handleApply}
                    className="w-full px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Применить
                </button>
            </footer>
        </div>
    );
};

export default MobileDateRangePicker;