import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText } from 'lucide-react';
import type { Report, ReportTheme } from '../../../types';
import { api } from '../../../services/api';
import TextInput from '../../../components/ui/TextInput';
import Select from '../../../components/ui/Select';
import { useAlert } from '../../../context/AlertContext';

interface ReportTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (report: Report) => void;
    report: Report | null;
    periodId: number;
}

const themeOptions: { value: ReportTheme, label: string }[] = [
    { value: 'infoudar', label: 'Инфоудар' },
    { value: 'vdpg', label: 'ВДПГ' },
    { value: 'event', label: 'Мероприятие' },
    { value: 'reg_event', label: 'Мероприятие в рег. парламенте' },
    { value: 'letter', label: 'Письмо' },
    { value: 'opt_event', label: 'Опциональное мероприятие' },
];

const ReportTypeModal: React.FC<ReportTypeModalProps> = ({ isOpen, onClose, onSuccess, report, periodId }) => {
    const [name, setName] = useState('');
    const [theme, setTheme] = useState<ReportTheme | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const { showAlert } = useAlert();
    const portalRoot = document.getElementById('root');

    useEffect(() => {
        if (report) {
            setName(report.name);
            setTheme(report.theme);
            setStartDate(report.startDate);
            setEndDate(report.endDate);
        } else {
            setName('');
            setTheme('');
            setStartDate('');
            setEndDate('');
        }
    }, [report, isOpen]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name.trim()) newErrors.name = 'Название отчёта обязательно.';
        if (!theme) newErrors.theme = 'Тема отчёта обязательна.';
        if (!startDate) newErrors.startDate = 'Дата начала отчета обязательна.';
        if (!endDate) newErrors.endDate = 'Дата окончания отчета обязательна.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setIsSaving(true);
        try {
            const reportData = { 
                reportPeriod: periodId,
                name, 
                theme: theme as ReportTheme,
                startDate,
                endDate
            };
            let result: Report;
            if (report) {
                result = await api.updateReport(report.id, reportData);
                 showAlert('success', 'Успешно', 'Тип отчета обновлен.');
            } else {
                result = await api.createReport(reportData);
                 showAlert('success', 'Успешно', 'Новый тип отчета создан.');
            }
            onSuccess(result);
        } catch (error) {
             showAlert('error', 'Ошибка', 'Не удалось сохранить тип отчета.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !portalRoot) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg m-4">
                <header className="flex items-center justify-between p-4 sm:p-6 border-b">
                    <div className="flex items-center gap-3">
                         <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{report ? 'Редактировать тип отчёта' : 'Новый тип отчёта'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-100"><X size={24} /></button>
                </header>
                <main className="p-4 sm:p-6 space-y-4">
                    <TextInput label="Название отчёта" name="name" value={name} onChange={(_, val) => setName(val)} required error={errors.name} />
                    <Select label="Тема" name="theme" value={theme} onChange={(_, val) => setTheme(val as ReportTheme)} options={themeOptions} required error={errors.theme} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextInput label="Дата начала" name="startDate" type="date" value={startDate} onChange={(_, val) => setStartDate(val)} required error={errors.startDate} />
                        <TextInput label="Дата окончания" name="endDate" type="date" value={endDate} onChange={(_, val) => setEndDate(val)} required error={errors.endDate} />
                    </div>
                </main>
                <footer className="flex justify-end gap-4 p-4 sm:p-6 bg-slate-50 border-t rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2.5 text-base font-semibold rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">Отмена</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300">
                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </footer>
            </div>
        </div>,
        portalRoot
    );
};

export default ReportTypeModal;