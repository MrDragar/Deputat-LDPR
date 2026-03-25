import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { addMonths, subMonths } from 'date-fns';
import { Calendar, DateRange } from './Calendar';

interface MobileDateRangePickerProps {
    isOpen: boolean;
    onClose: () => void;
    date: DateRange | undefined;
    onSelect: (date: Date) => void;
    disabledDates?: Date[];
}

const MobileDateRangePicker: React.FC<MobileDateRangePickerProps> = ({ isOpen, onClose, date, onSelect, disabledDates }) => {
    const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const startMonth = date?.from || new Date();
            const initialMonths = Array.from({ length: 12 }, (_, i) => addMonths(startMonth, i - 3));
            setVisibleMonths(initialMonths);

            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                const container = scrollContainerRef.current;
                if (container) {
                    const targetChild = container.children[3] as HTMLElement;
                    if (targetChild) {
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

    const handleScroll = useCallback(() => {
        if (isLoading || !scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        
        if (scrollHeight - scrollTop < clientHeight + 400) {
            setIsLoading(true);
            setVisibleMonths(prev => {
                const lastMonth = prev[prev.length - 1];
                const newMonths = Array.from({ length: 6 }, (_, i) => addMonths(lastMonth, i + 1));
                return [...prev, ...newMonths];
            });
            setTimeout(() => setIsLoading(false), 200);
        }
        
        if (scrollTop < 400 && visibleMonths.length > 0) {
            setIsLoading(true);
            const container = scrollContainerRef.current;
            const prevScrollHeight = container.scrollHeight;
            setVisibleMonths(prev => {
                const firstMonth = prev[0];
                const newMonths = Array.from({ length: 6 }, (_, i) => subMonths(firstMonth, 6 - i));
                return [...newMonths, ...prev];
            });
            setTimeout(() => {
                 if (container) container.scrollTop = scrollTop + (container.scrollHeight - prevScrollHeight);
                 setIsLoading(false);
            }, 0);
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
            className={`fixed inset-0 z-[100] flex flex-col bg-slate-50 ${isOpen ? 'flex' : 'hidden'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-date-picker-title"
        >
            <header className="flex items-center justify-between p-4 sticky top-0 bg-white z-10 shrink-0">
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
            
            <div ref={scrollContainerRef} className="flex-grow overflow-y-auto scrollbar-hide p-4 space-y-4 pb-24">
                 {visibleMonths.map((month) => (
                    <Calendar
                        key={month.toISOString()}
                        selected={date}
                        onDayClick={onSelect}
                        className="!rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100"
                        displayMonth={month}
                        showNavigation={false}
                        disabledDates={disabledDates}
                    />
                 ))}
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white z-20">
                <button
                    onClick={onClose}
                    className="w-full py-3.5 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
                >
                    Применить
                </button>
            </div>
        </div>
    );
};

export default MobileDateRangePicker;
