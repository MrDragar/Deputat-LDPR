import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText } from 'lucide-react';
import type { Report, ReportTheme, ReportPeriod } from '../../../types';
import { api } from '../../../services/api';
import TextInput from '../../../components/ui/TextInput';
import Select from '../../../components/ui/Select';
import { useAlert } from '../../../context/AlertContext';
import { DateRangePicker } from '../../../components/ui/DateRangePicker';
import { DateRange } from '../../../components/ui/Calendar';
import { parseISO, format } from 'date-fns';

interface ReportTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (report: Report) => void;
    onDelete?: (reportId: number) => void;
    report: Report | null;
    period: ReportPeriod;
}

const themeOptions: { value: ReportTheme, label: string }[] = [
    { value: 'infoudar', label: 'Инфоудар' },
    { value: 'event', label: 'Мероприятие' },
    { value: 'reg_event', label: 'Мероприятие в рег. парламенте' },
    { value: 'opt_event', label: 'Опциональное мероприятие' },
    { value: 'vdpg', label: 'ВДПГ' },
    { value: 'letter', label: 'Письмо' },
];

const ReportTypeModal: React.FC<ReportTypeModalProps> = ({ isOpen, onClose, onSuccess, onDelete, report, period }) => {
    const [name, setName] = useState(report?.name || '');
    const [theme, setTheme] = useState<ReportTheme | ''>(report?.theme || '');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (report?.startDate && report?.endDate) {
            return {
                from: parseISO(report.startDate),
                to: parseISO(report.endDate)
            };
        }
        return undefined;
    });
    const [description, setDescription] = useState(report?.description || '');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const { showAlert } = useAlert();
    const portalRoot = document.getElementById('root');

    const isEventTheme = useMemo(() => {
        return ['event', 'reg_event', 'opt_event'].includes(theme);
    }, [theme]);

    useEffect(() => {
        if (isOpen) {
            if (report) {
                setName(report.name);
                setTheme(report.theme);
                setDateRange(report.startDate && report.endDate ? { from: parseISO(report.startDate), to: parseISO(report.endDate) } : undefined);
                setDescription(report.description || '');
            } else {
                setName('');
                setTheme('');
                setDateRange(undefined);
                setDescription('');
            }
            setErrors({});
        }
    }, [report, isOpen]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!theme) {
            newErrors.theme = 'Тема слота обязательна.';
            setErrors(newErrors);
            return false;
        }

        if (!isEventTheme) {
            if (!name.trim()) newErrors.name = 'Название слота обязательно.';
            if (!dateRange?.from || !dateRange?.to) newErrors.dateRange = 'Период слота обязателен.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setIsSaving(true);
        try {
            // Для мероприятий имя по умолчанию берем из названия темы, даты берем пустые (или системные периода, если API требует)
            const finalName = isEventTheme ? themeOptions.find(o => o.value === theme)?.label || theme : name;
            
            const reportData = { 
                reportPeriod: period.id,
                name: finalName, 
                theme: theme as ReportTheme,
                startDate: isEventTheme ? new Date().toISOString().split('T')[0] : (dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''), // Fallback if API requires date
                endDate: isEventTheme ? new Date().toISOString().split('T')[0] : (dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''),
                description: isEventTheme ? undefined : description
            };

            let result: Report;
            if (report) {
                result = await api.updateReport(report.id, reportData);
                showAlert('success', 'Успешно', 'Слот обновлен.');
            } else {
                result = await api.createReport(reportData);
                showAlert('success', 'Успешно', 'Новый слот создан.');
            }
            onSuccess(result);
        } catch (error) {
             showAlert('error', 'Ошибка', 'Не удалось сохранить слот.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !portalRoot) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg my-auto animate-in zoom-in-95 duration-200">
                <header className="flex items-center justify-between p-4 sm:p-6 border-b">
                    <h2 className="text-lg font-bold text-gray-900">{report ? 'Редактирование слота' : 'Новый слот'}</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-100 transition-colors"><X size={24} /></button>
                </header>
                <main className="p-4 sm:p-6 space-y-5">
                    <Select label="Тема слота" name="theme" value={theme} onChange={(_, val) => setTheme(val as ReportTheme)} options={themeOptions} required error={errors.theme} />
                    
                    {!isEventTheme && theme !== '' && (
                        <div className="space-y-5">
                            <TextInput label="Название слота" name="name" value={name} onChange={(_, val) => setName(val)} required error={errors.name} placeholder="Например: Прямой эфир с Л.Э. Слуцким" />
                            <div>
                                <label className="block text-sm font-semibold text-gray-800 mb-1">
                                    Период слота <span className="text-red-500">*</span>
                                </label>
                                <DateRangePicker 
                                    date={dateRange} 
                                    onDateChange={setDateRange} 
                                    minDate={parseISO(period.startDate)}
                                    maxDate={parseISO(period.endDate)}
                                />
                                {errors.dateRange && <p className="mt-1 text-sm text-red-600">{errors.dateRange}</p>}
                            </div>
                            <TextInput label="Описание (необязательно)" name="description" type="textarea" value={description} onChange={(_, val) => setDescription(val)} placeholder="Укажите дополнительные требования к слоту..." />
                        </div>
                    )}

                    {isEventTheme && (
                        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm">
                            Для мероприятий даты и название не требуются. Слот будет создан автоматически на основе выбранной темы.
                        </div>
                    )}
                </main>
                <footer className="flex justify-end items-center p-4 sm:p-6 bg-slate-50 border-t rounded-b-xl gap-4">
                    <button onClick={onClose} className="px-6 py-2.5 text-base font-semibold rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors">Отмена</button>
                    <button onClick={handleSave} disabled={isSaving || (theme === '')} className="px-6 py-2.5 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors">
                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </footer>
            </div>
        </div>,
        portalRoot
    );
};

export default ReportTypeModal;