import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { startOfDay, addMonths, format } from 'date-fns';
import { Calendar, DateRange } from './Calendar';

interface MobileDateRangePickerProps {
    isOpen: boolean;
    onClose: () => void;
    date: DateRange | undefined;
    onApply: (date: DateRange | undefined) => void;
    minDate?: Date;
    maxDate?: Date;
}

const MobileDateRangePicker: React.FC<MobileDateRangePickerProps> = ({ isOpen, onClose, date, onApply, minDate, maxDate }) => {
    const [tempDate, setTempDate] = useState<DateRange | undefined>(date);
    const [visibleMonths, setVisibleMonths] = useState<Date[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTempDate(date);
            const startMonth = date?.from || new Date();
            // Generate 12 months before and 12 months after the selected date
            const months = Array.from({ length: 25 }, (_, i) => addMonths(startMonth, i - 12));
            setVisibleMonths(months);

            document.body.style.overflow = 'hidden';
            
            // Scroll to the selected month (index 12)
            setTimeout(() => {
                const container = scrollContainerRef.current;
                if (container && container.children[12]) {
                    const targetChild = container.children[12] as HTMLElement;
                    container.scrollTop = targetChild.offsetTop - container.offsetTop - 16;
                }
            }, 50);

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
      const dayStart = startOfDay(day);
      const minStart = minDate ? startOfDay(minDate) : undefined;
      const maxStart = maxDate ? startOfDay(maxDate) : undefined;
      if ((minStart && dayStart < minStart) || (maxStart && dayStart > maxStart)) return;
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

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col bg-slate-50 animate-in slide-in-from-bottom-4 duration-300"
            role="dialog"
            aria-modal="true"
        >
            <div className="sticky top-0 bg-white z-10 shrink-0 border-b border-gray-200 pt-[env(safe-area-inset-top)]">
                <header className="flex items-center justify-between h-14 px-4 box-content">
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                        Выберите день или период
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </header>
                <div className="px-4 pb-3">
                    <div className="text-sm font-medium text-blue-600">
                        {tempDate?.from ? (
                            tempDate.to ? (
                                `${format(tempDate.from, 'dd.MM.yyyy')} — ${format(tempDate.to, 'dd.MM.yyyy')}`
                            ) : (
                                format(tempDate.from, 'dd.MM.yyyy')
                            )
                        ) : (
                            <span className="text-gray-400">Не выбран</span>
                        )}
                    </div>
                </div>
            </div>
            
            <div ref={scrollContainerRef} className="flex-grow overflow-y-auto scrollbar-hide p-4 space-y-4">
                 {visibleMonths.map((month) => (
                    <div key={month.toISOString()} className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <Calendar
                            selected={tempDate}
                            onDayClick={handleDayClick}
                            className="w-full max-w-none border-none shadow-none"
                            displayMonth={month}
                            showNavigation={false}
                            minDate={minDate}
                            maxDate={maxDate}
                        />
                    </div>
                 ))}
            </div>
            
            <footer className="p-4 border-t border-gray-200 sticky bottom-0 bg-white z-10 shrink-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
                <button
                    onClick={handleApply}
                    className="w-full py-3.5 text-base font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Применить
                </button>
            </footer>
        </div>
    );
};

export default MobileDateRangePicker;