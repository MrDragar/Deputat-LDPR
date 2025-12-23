import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Link as LinkIcon } from 'lucide-react';
import { api } from '../../../services/api';
import TextInput from '../../../components/ui/TextInput';
import { useAlert } from '../../../context/AlertContext';
import type { ReportRecord } from '../../../types';

interface ReportSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (record: ReportRecord) => void;
    submissionData: {
        deputyRecordId: number;
        reportId: number;
        recordId?: number; // for editing
        link?: string;
    };
}

const ReportSubmissionModal: React.FC<ReportSubmissionModalProps> = ({ isOpen, onClose, onSuccess, submissionData }) => {
    const [link, setLink] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showAlert } = useAlert();
    const portalRoot = document.getElementById('root');

    useEffect(() => {
        setLink(submissionData.link || '');
    }, [submissionData, isOpen]);

    const validateUrl = (value: string) => {
        if (!value.trim()) {
            setError('Ссылка не может быть пустой.');
            return false;
        }
        try {
            new URL(value);
            setError(null);
            return true;
        } catch (_) {
            setError('Пожалуйста, введите корректную ссылку (например, https://example.com).');
            return false;
        }
    };
    
    const handleUrlChange = (name: string, value: string) => {
        setLink(value);
        if (error) {
            validateUrl(value);
        }
    };

    const handleSave = async () => {
        if (!validateUrl(link)) return;
        setIsSaving(true);
        try {
            const recordData = {
                report: submissionData.reportId,
                deputyRecord: submissionData.deputyRecordId,
                link,
            };

            let result: ReportRecord;
            if (submissionData.recordId) {
                // Editing existing record
                result = await api.updateReportRecord(submissionData.recordId, recordData);
            } else {
                // Creating new record
                result = await api.createReportRecord(recordData);
            }

            showAlert('success', 'Успешно', 'Отчёт сохранен.');
            onSuccess(result);
        } catch (apiError) {
             showAlert('error', 'Ошибка', 'Не удалось сохранить отчёт.');
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
                            <LinkIcon className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{submissionData.link ? 'Редактировать отчёт' : 'Отправить отчёт'}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-100"><X size={24} /></button>
                </header>
                <main className="p-4 sm:p-6">
                    <TextInput
                        label="Ссылка на отчёт"
                        name="link"
                        type="url"
                        placeholder="https://..."
                        value={link}
                        onChange={handleUrlChange}
                        required
                        error={error || undefined}
                    />
                </main>
                <footer className="flex justify-end gap-4 p-4 sm:p-6 bg-slate-50 border-t rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2.5 text-base font-semibold rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">Отмена</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300">
                        {isSaving ? 'Отправка...' : 'Отправить'}
                    </button>
                </footer>
            </div>
        </div>,
        portalRoot
    );
};

export default ReportSubmissionModal;