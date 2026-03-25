import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { Calendar as CalendarIcon, X } from "lucide-react";
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

  const buttonTextContent = (
    <span className={`truncate ${!date?.from ? "text-gray-500" : "text-gray-900"}`}>
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
        "Выберите дату"
      )}
    </span>
  );

  const portalRoot = document.getElementById('reports-view-root') || document.body;

  return (
    <div className="relative w-full h-[42px]" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full px-4 border rounded-lg flex items-center justify-between text-left focus:outline-none focus:border-gray-400 transition-colors cursor-pointer ${isOpen ? 'border-gray-400 bg-white' : 'border-gray-300 bg-white hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <CalendarIcon className="h-5 w-5 text-gray-400 shrink-0" />
          {buttonTextContent}
        </div>
      </button>

      {date?.from && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDateChange(undefined);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          title="Очистить дату"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {isMobile && createPortal(
        <MobileDateRangePicker
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          date={date}
          onSelect={handleDayClick}
        />,
        portalRoot
      )}
      
      {isOpen && !isMobile && (
        <div className="absolute z-10 top-full mt-2 right-0 w-[320px] shadow-lg rounded-xl border border-gray-200 bg-white overflow-hidden">
          <Calendar
            selected={date}
            onDayClick={handleDayClick}
          />
        </div>
      )}
    </div>
  );
}
