import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
// FIX: `subDays` was not found in the main export, so it's imported directly from its subpath.
import { eachDayOfInterval, addDays, format, isSameDay, isSameMonth } from 'date-fns';
import subDays from 'date-fns/subDays';
// FIX: The `ru` locale is imported from its specific path, which is required in newer versions of date-fns.
import { ru } from 'date-fns/locale/ru';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface DateScrollerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onOpenCalendar: () => void;
}

const DateScroller: React.FC<DateScrollerProps> = ({ selectedDate, onDateSelect, onOpenCalendar }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [displayMonth, setDisplayMonth] = useState(selectedDate);
  const isInitialMount = useRef(true);
  const displayMonthRef = useRef(displayMonth); // Ref to prevent stale closure in scroll handler

  // Keep the ref in sync with the state
  useEffect(() => {
    displayMonthRef.current = displayMonth;
  }, [displayMonth]);

  const days = useMemo(() => {
    // Generate a wide range of days centered around the current date for smooth scrolling
    const centerDate = new Date();
    return eachDayOfInterval({
        start: subDays(centerDate, 180),
        end: addDays(centerDate, 180),
    });
  }, []);
  
  useEffect(() => {
    // When selectedDate changes (e.g. from calendar modal), update the display month
    // so the header and the scroller are in sync.
    if (!isSameMonth(selectedDate, displayMonth)) {
      setDisplayMonth(selectedDate);
    }
  }, [selectedDate, displayMonth]);

  const changeDay = (direction: 'prev' | 'next') => {
      const currentIndex = days.findIndex(day => isSameDay(day, selectedDate));
      const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex >= 0 && newIndex < days.length) {
          onDateSelect(days[newIndex]);
      }
  };
  
  useEffect(() => {
    const selectedElement = scrollContainerRef.current?.querySelector('[data-selected="true"]');
    if (selectedElement && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const element = selectedElement as HTMLElement;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        const scrollLeft = element.offsetLeft - (containerRect.width / 2) + (elementRect.width / 2);
        
        container.scrollTo({
            left: scrollLeft,
            behavior: isInitialMount.current ? 'auto' : 'smooth'
        });
        isInitialMount.current = false;
    }
  }, [selectedDate]);

  // This callback is now stable because it depends only on `days`
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    
    let closestIndex = -1;
    let minDistance = Infinity;

    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child, index) => {
      if (child.nodeName === 'DIV') { // Ensure we only check the wrapper divs
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const distance = Math.abs(scrollLeft + containerWidth / 2 - childCenter);
        if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
        }
      }
    });

    if (closestIndex !== -1) {
        const newDisplayDate = days[closestIndex];
        // Use the ref here to get the current value without causing re-renders of the handler
        if (!isSameMonth(newDisplayDate, displayMonthRef.current)) {
            setDisplayMonth(newDisplayDate);
        }
    }
  }, [days]);

  // This effect now runs only once to attach the listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    let ticking = false;

    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', scrollListener, { passive: true });
    return () => container.removeEventListener('scroll', scrollListener);
  }, [handleScroll]);

  return (
    <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center mb-4">
            <p className="font-bold text-lg text-gray-800 capitalize">{format(displayMonth, 'LLLL yyyy', { locale: ru })}</p>
            <button 
              onClick={onOpenCalendar} 
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500" 
              aria-label="Открыть календарь"
            >
                <CalendarDays className="h-4 w-4" />
                <span>Выбрать дату</span>
            </button>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
           <button onClick={() => changeDay('prev')} className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500" aria-label="Предыдущий день">
                <ChevronLeft className="h-5 w-5" />
           </button>
           <div 
              ref={scrollContainerRef}
              className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 -mb-2 snap-x snap-mandatory scrollbar-hide"
            >
              {days.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <div key={day.toString()} className="snap-center">
                    <button
                      onClick={() => onDateSelect(day)}
                      data-selected={isSelected}
                      className={`flex flex-col items-center justify-center w-14 h-16 rounded-lg transition-colors duration-200 flex-shrink-0 ${
                        isSelected 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span className={`text-sm font-medium capitalize ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{format(day, 'EEEEEE', { locale: ru })}</span>
                      <span className="text-xl font-semibold mt-1">{format(day, 'dd')}</span>
                    </button>
                  </div>
                );
              })}
            </div>
           <button onClick={() => changeDay('next')} className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500" aria-label="Следующий день">
                <ChevronRight className="h-5 w-5" />
           </button>
        </div>
    </div>
  );
};

export default DateScroller;
