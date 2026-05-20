import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ReportPeriod } from '../../../types';
import { api } from '../../../services/api';
import { useAlert } from '../../../context/AlertContext';
import { Calendar, DateRange } from '../../../components/ui/Calendar';
import { parseISO, format, startOfDay, addMonths } from 'date-fns';

interface ReportPeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (period: ReportPeriod) => void;
    period: ReportPeriod | null;
}

const ReportPeriodModal: React.FC<ReportPeriodModalProps> = ({ isOpen, onClose, onSuccess, period }) => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (period?.startDate && period?.endDate) {
            return {
                from: parseISO(period.startDate),
                to: parseISO(period.endDate)
            };
        }
        return undefined;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const { showAlert } = useAlert();
    const portalRoot = document.getElementById('root');

    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [visibleMonths, setVisibleMonths] = useState<Date[]>(() => {
        const startMonth = period?.startDate ? parseISO(period.startDate) : new Date();
        return Array.from({ length: 25 }, (_, i) => addMonths(startMonth, i - 12));
    });
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (period) {
            setDateRange({
                from: parseISO(period.startDate),
                to: parseISO(period.endDate)
            });
        } else {
            setDateRange(undefined);
        }
    }, [period, isOpen]);

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen && isMobile) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, isMobile]);

    // Handle synchronous scrolling before paint
    const hasScrolledRef = useRef(false);
    React.useLayoutEffect(() => {
        if (isOpen && isMobile && scrollContainerRef.current && !hasScrolledRef.current) {
            const container = scrollContainerRef.current;
            if (container.children[12]) {
                const targetChild = container.children[12] as HTMLElement;
                container.scrollTop = targetChild.offsetTop - container.offsetTop - 16;
                hasScrolledRef.current = true;
            }
        }
    }, [isOpen, isMobile]);

    // Reset scroll state when modal closes
    useEffect(() => {
        if (!isOpen) {
            hasScrolledRef.current = false;
        }
    }, [isOpen]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!dateRange?.from || !dateRange?.to) newErrors.dateRange = 'Период обязателен.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleDayClick = (day: Date) => {
        const dayStart = startOfDay(day);
        if (dateRange?.from && !dateRange.to && day.getTime() === dateRange.from.getTime()) {
            setDateRange(undefined);
        } else if (dateRange?.from && dateRange.to && (day.getTime() === dateRange.from.getTime() || day.getTime() === dateRange.to.getTime())) {
            const newSingleDate = day.getTime() === dateRange.from.getTime() ? dateRange.to : dateRange.from;
            setDateRange({ from: newSingleDate, to: undefined });
        } else {
            const newRange = dateRange ? { from: dateRange.from, to: dateRange.to } : { from: undefined, to: undefined };
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
            setDateRange(newRange);
        }
    };

    const handleSave = async () => {
        if (!validate()) return;
        setIsSaving(true);
        try {
            const periodData = { 
                startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '', 
                endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '' 
            };
            let result: ReportPeriod;
            
            if (period) {
                result = await api.updateReportPeriod(period.id, periodData);
                showAlert('success', 'Успешно', 'Отчетный период обновлен.');
            } else {
                result = await api.createReportPeriod(periodData);
                showAlert('success', 'Успешно', 'Новый отчетный период создан.');
            }
            onSuccess(result);
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось сохранить период.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !portalRoot) return null;

    if (isMobile) {
        return createPortal(
            <div
                className="fixed inset-0 z-50 flex flex-col bg-slate-50 animate-in slide-in-from-bottom-4 duration-300"
                role="dialog"
                aria-modal="true"
            >
                <div className="sticky top-0 bg-white z-10 shrink-0 border-b border-gray-200 pt-[env(safe-area-inset-top)]">
                    <header className="flex items-center justify-between h-14 px-4 box-content">
                        <h2 className="text-lg font-bold text-gray-900 truncate">
                            {period ? 'Редактировать период' : 'Новый отчётный период'}
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
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    `${format(dateRange.from, 'dd.MM.yyyy')} — ${format(dateRange.to, 'dd.MM.yyyy')}`
                                ) : (
                                    format(dateRange.from, 'dd.MM.yyyy')
                                )
                            ) : (
                                <span className="text-gray-400">Не выбран</span>
                            )}
                        </div>
                        {errors.dateRange && <p className="mt-1 text-sm text-red-600 text-left">{errors.dateRange}</p>}
                    </div>
                </div>
                
                <div ref={scrollContainerRef} className="flex-grow overflow-y-auto scrollbar-hide p-4 space-y-4">
                     {visibleMonths.map((month) => (
                        <div key={month.toISOString()} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <Calendar
                                selected={dateRange}
                                onDayClick={handleDayClick}
                                className="w-full max-w-none border-none shadow-none"
                                displayMonth={month}
                                showNavigation={false}
                            />
                        </div>
                     ))}
                </div>
                
                <footer className="p-4 border-t border-gray-200 sticky bottom-0 bg-white z-10 shrink-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !dateRange?.from || !dateRange?.to}
                        className="w-full py-3.5 text-base font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        {isSaving ? 'Сохранение...' : period ? 'Сохранить' : 'Создать период'}
                    </button>
                </footer>
            </div>,
            portalRoot
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg my-auto flex flex-col animate-in zoom-in-95 duration-200">
                <header className="flex items-center justify-between px-6 py-4 border-b shrink-0 box-border">
                    <h2 className="text-lg font-bold text-gray-900">{period ? 'Редактировать период' : 'Новый отчётный период'}</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-100 transition-colors"><X size={24} /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col items-center">
                    <div className="w-full">
                        <div className="mb-4 text-left">
                            <div className="text-sm font-medium text-blue-600">
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        `${format(dateRange.from, 'dd.MM.yyyy')} — ${format(dateRange.to, 'dd.MM.yyyy')}`
                                    ) : (
                                        format(dateRange.from, 'dd.MM.yyyy')
                                    )
                                ) : (
                                    <span className="text-gray-400">Не выбран</span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <Calendar 
                                selected={dateRange} 
                                onDayClick={handleDayClick}
                                className="border-none shadow-none w-full max-w-none" 
                            />
                        </div>
                        {errors.dateRange && <p className="mt-2 text-sm text-red-600 text-left">{errors.dateRange}</p>}
                    </div>
                </main>
                <footer className="flex justify-end items-center p-6 bg-slate-50 border-t rounded-b-xl gap-4 shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 text-base font-semibold rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors">Отмена</button>
                    <button onClick={handleSave} disabled={isSaving || !dateRange?.from || !dateRange?.to} className="px-6 py-2.5 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors">
                        {isSaving ? 'Сохранение...' : period ? 'Сохранить' : 'Создать период'}
                    </button>
                </footer>
            </div>
        </div>,
        portalRoot
    );
};

export default ReportPeriodModal;