import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
// FIX: The `ru` locale is imported from its specific path, which is required in newer versions of date-fns.
import { ru } from "date-fns/locale/ru";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange, Calendar } from "./Calendar";
import MobileDateRangePicker from "./MobileDateRangePicker";

interface DateRangePickerProps {
    date: DateRange | undefined;
    onDateChange: (date: DateRange | undefined) => void;
}

export function DateRangePicker({ date, onDateChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen && !isMobile) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile]);
  
  const handleDayClick = (day: Date) => {
      if (date?.from && !date.to && day.getTime() === date.from.getTime()) {
          onDateChange(undefined);
      } else if (date?.from && date.to && (day.getTime() === date.from.getTime() || day.getTime() === date.to.getTime())) {
          const newSingleDate = day.getTime() === date.from.getTime() ? date.to : date.from;
          onDateChange({ from: newSingleDate, to: undefined });
      } else {
          const newRange = date ? { from: date.from, to: date.to } : { from: undefined, to: undefined };
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
          onDateChange(newRange);
      }
  };
  
  const handleMobileApply = useCallback((newDate: DateRange | undefined) => {
      onDateChange(newDate);
  }, [onDateChange]);

  const buttonTextContent = (
    <span className={!date?.from ? "text-gray-500" : "text-gray-900"}>
        {date?.from ? (
            date.to ? (
            <>
                {format(date.from, "d MMM yyyy", { locale: ru })} -{" "}
                {format(date.to, "d MMM yyyy", { locale: ru })}
            </>
            ) : (
            format(date.from, "d MMM yyyy", { locale: ru })
            )
        ) : (
            <span>Выберите дату</span>
        )}
    </span>
  );

  const portalRoot = document.getElementById('root');

  if (isMobile && portalRoot) {
      return (
          <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="w-full pl-12 pr-4 py-3 border rounded-md shadow-sm bg-white text-left text-base flex items-center justify-start focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
              >
                  {buttonTextContent}
              </button>
              {isOpen && createPortal(
                  <MobileDateRangePicker 
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    date={date}
                    onApply={handleMobileApply}
                  />,
                  portalRoot
              )}
          </div>
      );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
      </div>
      <button
        id="date"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-12 pr-4 py-3 border rounded-md shadow-sm bg-white text-left text-base flex items-center justify-start focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-300"
      >
        {buttonTextContent}
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full mt-2 right-0 sm:right-auto sm:left-0">
            <Calendar
                selected={date}
                onDayClick={handleDayClick}
            />
        </div>
      )}
    </div>
  );
}