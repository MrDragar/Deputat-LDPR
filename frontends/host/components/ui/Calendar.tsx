import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// FIX: Split date-fns imports. Functions that were reported as missing are imported directly from their subpaths.
import { 
    format, 
    addMonths, 
    endOfMonth, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay,
    isToday,
    isWithinInterval
} from 'date-fns';
import subMonths from 'date-fns/subMonths';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
// FIX: The `ru` locale is imported from its specific path, which is required in newer versions of date-fns.
import { ru } from 'date-fns/locale/ru';

export interface DateRange {
    from: Date | undefined;
    to: Date | undefined;
}

interface CalendarProps {
    selected?: DateRange;
    onDayClick: (day: Date) => void;
    className?: string;
    displayMonth?: Date;
    showNavigation?: boolean;
    disabledDates?: Date[];
}

export const Calendar: React.FC<CalendarProps> = ({ 
    selected, 
    onDayClick, 
    className, 
    displayMonth, 
    showNavigation = true,
    disabledDates = []
}) => {
    const [internalMonth, setInternalMonth] = useState(selected?.from || new Date());
    const currentMonth = displayMonth || internalMonth;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    // Ensure week starts on Monday for 'ru' locale
    const startDate = startOfWeek(monthStart, { locale: ru });
    const endDate = endOfWeek(monthEnd, { locale: ru });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setInternalMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setInternalMonth(subMonths(currentMonth, 1));

    const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

    return (
        <div className={`p-4 bg-white rounded-lg w-full max-w-sm ${className}`}>
             <div className="flex justify-between items-center mb-4">
                {showNavigation ? (
                    <button type="button" onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                ) : <div className="w-9" />}
                <div className="text-base font-semibold text-gray-800 capitalize">
                    {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                </div>
                {showNavigation ? (
                    <button type="button" onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                ) : <div className="w-9" />}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 font-medium mb-2">
                {weekDays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
                {days.map(day => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDisabled = disabledDates.some(disabledDate => isSameDay(day, disabledDate));
                    const isRangeSelected = !!(selected?.from && selected.to);
                    const isStart = selected?.from && isSameDay(day, selected.from);
                    const isEnd = selected?.to && isSameDay(day, selected.to);
                    const isInRange = isRangeSelected && isWithinInterval(day, { start: selected.from!, end: selected.to! });
                    const isSelected = isStart || isEnd;
                    const isSingleDaySelection = selected?.from && !selected.to && isSameDay(day, selected.from);
                    
                    const isRangeStart = isStart && isRangeSelected;
                    const isRangeEnd = isEnd && isRangeSelected;
                    const isRangeMiddle = isInRange && !isStart && !isEnd;

                    const isStartOfWeekForRange = isSameDay(day, startOfWeek(day, { locale: ru }));
                    const isEndOfWeekForRange = isSameDay(day, endOfWeek(day, { locale: ru }));

                    let backgroundClasses = 'absolute inset-y-0 h-10 bg-blue-100';
                    let shouldRenderBackground = true;

                    if (isRangeStart && isRangeEnd) {
                        shouldRenderBackground = false;
                    } else if (isRangeStart) {
                        backgroundClasses += ' left-1/2 w-1/2';
                    } else if (isRangeEnd) {
                        backgroundClasses += ' right-1/2 w-1/2';
                    } else if (isRangeMiddle) {
                        backgroundClasses += ' left-0 w-full';
                        if (isStartOfWeekForRange) {
                            backgroundClasses += ' rounded-l-full';
                        }
                        if (isEndOfWeekForRange) {
                            backgroundClasses += ' rounded-r-full';
                        }
                    } else {
                        shouldRenderBackground = false;
                    }


                    const buttonClasses = [
                        'relative z-10 w-10 h-10',
                        'flex items-center justify-center',
                        'rounded-full',
                        'text-sm transition-colors duration-150',
                        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
                        isDisabled
                            ? 'text-gray-400 line-through cursor-not-allowed'
                            : isSelected || isSingleDaySelection
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : isCurrentMonth 
                                    ? 'text-gray-900 hover:bg-gray-100' 
                                    : 'text-gray-400',
                        isToday(day) && !isSelected && !isInRange && !isDisabled ? 'font-semibold' : '',
                    ].filter(Boolean).join(' ');

                    return (
                        <div key={day.toISOString()} className="relative flex justify-center items-center h-10">
                            {shouldRenderBackground && !isDisabled && <div className={backgroundClasses}></div>}
                            <button
                                type="button"
                                disabled={!isCurrentMonth || isDisabled}
                                onClick={() => isCurrentMonth && !isDisabled && onDayClick(day)}
                                className={buttonClasses}
                            >
                                {format(day, 'd')}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};