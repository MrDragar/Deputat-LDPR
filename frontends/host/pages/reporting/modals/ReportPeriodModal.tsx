import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar } from 'lucide-react';
import type { ReportPeriod } from '../../../types';
import { api } from '../../../services/api';
import TextInput from '../../../components/ui/TextInput';
import { useAlert } from '../../../context/AlertContext';

interface ReportPeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (period: ReportPeriod) => void;
    period: ReportPeriod | null;
}

const ReportPeriodModal: React.FC<ReportPeriodModalProps> = ({ isOpen, onClose, onSuccess, period }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const { showAlert } = useAlert();
    const portalRoot = document.getElementById('root');

    useEffect(() => {
        if (period) {
            setStartDate(period.startDate);
            setEndDate(period.endDate);
        } else {
            setStartDate('');
            setEndDate('');
        }
    }, [period, isOpen]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!startDate) newErrors.startDate = 'Дата начала обязательна.';
        if (!endDate) newErrors.endDate = 'Дата окончания обязательна.';
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            newErrors.endDate = 'Дата окончания не может быть раньше даты начала.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setIsSaving(true);
        try {
            const periodData = { startDate, endDate };
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

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg m-4">
                <header className="flex items-center justify-between p-4 sm:p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{period ? 'Редактировать период' : 'Новый отчётный период'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-100"><X size={24} /></button>
                </header>
                <main className="p-4 sm:p-6 space-y-4">
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

export default ReportPeriodModal;