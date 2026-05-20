import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import type { Report, ReportTheme, ReportPeriod } from '../../types';
import { api } from '../../services/api';
import TextInput from '../../components/ui/TextInput';
import Select from '../../components/ui/Select';
import { useAlert } from '../../context/AlertContext';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { DateRange } from '../../components/ui/Calendar';
import { parseISO, format } from 'date-fns';

interface MobileSlotDetailViewProps {
    report: Report | null;
    period: ReportPeriod;
    onClose: () => void;
    onSuccess: () => void;
    onDelete: (id: number) => void;
}

const themeOptions: { value: ReportTheme, label: string }[] = [
    { value: 'infoudar', label: 'Инфоудар' },
    { value: 'event', label: 'Мероприятие' },
    { value: 'reg_event', label: 'Мероприятие в рег. парламенте' },
    { value: 'opt_event', label: 'Опциональное мероприятие' },
    { value: 'vdpg', label: 'ВДПГ' },
    { value: 'letter', label: 'Письмо' },
];

const MobileSlotDetailView: React.FC<MobileSlotDetailViewProps> = ({ report, period, onClose, onSuccess, onDelete }) => {
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
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const { showAlert } = useAlert();
    const portalRoot = document.getElementById('root');

    const isEventTheme = useMemo(() => {
        return ['event', 'reg_event', 'opt_event'].includes(theme);
    }, [theme]);

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

    const handleApproveClick = () => {
        if (!validate()) return;
        setIsApproveModalOpen(true);
    };

    const handleSave = async () => {
        setIsApproveModalOpen(false);
        setIsSaving(true);
        try {
            const finalName = isEventTheme ? themeOptions.find(o => o.value === theme)?.label || theme : name;
            
            const reportData = { 
                reportPeriod: period.id,
                name: finalName, 
                theme: theme as ReportTheme,
                startDate: isEventTheme ? new Date().toISOString().split('T')[0] : (dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''),
                endDate: isEventTheme ? new Date().toISOString().split('T')[0] : (dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''),
                description: isEventTheme ? undefined : description
            };

            if (report) {
                await api.updateReport(report.id, reportData);
                showAlert('success', 'Успешно', 'Слот обновлен.');
            } else {
                await api.createReport(reportData);
                showAlert('success', 'Успешно', 'Новый слот создан.');
            }
            onSuccess();
        } catch (error) {
             showAlert('error', 'Ошибка', 'Не удалось сохранить слот.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!portalRoot) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300 sm:hidden">
            <header className="flex items-center h-14 px-4 border-b border-gray-200 sticky top-0 bg-white z-10 shrink-0 gap-3 pt-[env(safe-area-inset-top)] box-content">
                <button
                    onClick={onClose}
                    className="p-2 -ml-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Назад"
                >
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h2 className="text-lg font-bold text-gray-900 truncate">
                    {report ? 'Редактирование слота' : 'Новый слот'}
                </h2>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-5 pb-safe">
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

                <div className="pt-8 space-y-3">
                    {report && (
                        <button 
                            onClick={() => onDelete(report.id)} 
                            className="w-full py-3.5 text-base font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            Удалить слот
                        </button>
                    )}
                    <button 
                        onClick={handleApproveClick} 
                        disabled={isSaving || (theme === '')} 
                        className="w-full py-3.5 text-base font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                        {isSaving ? 'Сохранение...' : (report ? 'Сохранить изменения' : 'Создать слот')}
                    </button>
                </div>
            </main>

            <ConfirmationModal 
                isOpen={isApproveModalOpen} 
                onClose={() => setIsApproveModalOpen(false)} 
                onConfirm={handleSave} 
                title="Сохранить слот?" 
                confirmButtonVariant="primary"
                confirmButtonText="Сохранить"
            >
                Вы уверены, что хотите сохранить изменения для этого слота?
            </ConfirmationModal>
        </div>,
        portalRoot
    );
};

export default MobileSlotDetailView;
