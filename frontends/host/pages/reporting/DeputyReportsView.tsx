import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { DeputyViewData, ReportRecord, ReportTheme } from '../../types';
import { Plus, Link as LinkIcon, Edit, Trash2, Inbox } from 'lucide-react';
import IconButton from '../../components/ui/IconButton';
import ReportSubmissionModal from './modals/ReportSubmissionModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAlert } from '../../context/AlertContext';
import DeputyReportsSkeleton from '../../components/skeletons/DeputyReportsSkeleton';

const DeputyReportsView: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<DeputyViewData | null>(null);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useAlert();

    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
    const [editingSubmission, setEditingSubmission] = useState<{ deputyRecordId: number, reportId: number, recordId?: number, link?: string } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<ReportRecord | null>(null);


    const fetchData = useCallback(async () => {
        if (user) {
            try {
                setLoading(true);
                const responseData = await api.getDeputyViewData(user.user_id);
                setData(responseData);
            } catch (error) {
                 showAlert('error', 'Ошибка', 'Не удалось загрузить данные отчётности.');
            } finally {
                setLoading(false);
            }
        }
    }, [user, showAlert]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getSubmissions = (reportId: number): ReportRecord[] => {
        if (!data?.deputyRecord) return [];
        return data.reportRecords.filter(s => s.report === reportId && s.deputyRecord === data.deputyRecord!.id);
    };

    // Modal Handlers
    const handleOpenSubmissionModal = (reportId: number, submission?: ReportRecord) => {
        if (!data?.deputyRecord) return;
        setEditingSubmission({ 
            deputyRecordId: data.deputyRecord.id, 
            reportId, 
            link: submission?.link || undefined,
            recordId: submission?.id
        });
        setIsSubmissionModalOpen(true);
    };

    const handleSubmissionSuccess = (record: ReportRecord) => {
        setIsSubmissionModalOpen(false);
        setData(prev => {
            if (!prev) return null;
            const isEdit = prev.reportRecords.some(r => r.id === record.id);
            let newRecords;
            if (isEdit) {
                newRecords = prev.reportRecords.map(r => r.id === record.id ? record : r);
            } else {
                newRecords = [...prev.reportRecords, record];
            }
            return { ...prev, reportRecords: newRecords };
        });
    };

    const handleOpenDeleteModal = (record: ReportRecord) => {
        setRecordToDelete(record);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;
        try {
            await api.deleteReportRecord(recordToDelete.id);
            showAlert('success', 'Успешно', 'Ваш отчёт удалён.');
            
            setData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    reportRecords: prev.reportRecords.filter(r => r.id !== recordToDelete.id)
                };
            });
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось удалить отчёт.');
        } finally {
            setIsDeleteModalOpen(false);
            setRecordToDelete(null);
        }
    };

    if (loading || !data) {
        return <DeputyReportsSkeleton />;
    }
    
     if (data.reports.length === 0) {
        return (
            <div className="text-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                <Inbox className="h-16 w-16 text-gray-300 mx-auto" />
                <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Нет заданий</h1>
                <p className="text-gray-600">На текущий отчётный период ({data.period.name}) не назначено обязательных отчётов.</p>
                 <p className="text-sm text-gray-500 mt-4">Если вы считаете, что это ошибка, обратитесь к вашему координатору.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Моя отчётность</h1>
                    <p className="mt-1 text-gray-500">Период: <span className="font-semibold">{data.period.name}</span></p>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <ul className="divide-y divide-gray-200">
                        {data.reports.map(report => {
                            const submissions = getSubmissions(report.id);
                            // Auto-created records from server have null links
                            const emptySubmission = submissions.find(s => !s.link);
                            const completedSubmissions = submissions.filter(s => s.link);
                            
                            const isMultiSubmission = (['event', 'opt_event'] as ReportTheme[]).includes(report.theme);

                            return (
                                <li key={report.id} className="p-6 flex flex-col gap-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-lg text-gray-800">{report.name}</p>
                                                {report.theme === 'opt_event' && (
                                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Опционально</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{report.themeDisplay}</p>
                                        </div>
                                    </div>

                                    {/* List of submitted reports */}
                                    {completedSubmissions.length > 0 && (
                                        <div className="flex flex-col gap-2 w-full">
                                            {completedSubmissions.map((submission, idx) => (
                                                <div key={submission.id} className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg group animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <a href={submission.link!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:underline font-semibold text-sm truncate max-w-[70%]">
                                                        <LinkIcon size={14} />
                                                        <span className="truncate">{submission.link}</span>
                                                    </a>
                                                    <div className="flex items-center gap-1">
                                                        <IconButton icon={Edit} aria-label="Изменить ссылку" onClick={() => handleOpenSubmissionModal(report.id, submission)} className="text-gray-500 hover:bg-gray-200 h-8 w-8" />
                                                        <IconButton icon={Trash2} aria-label="Удалить отчет" onClick={() => handleOpenDeleteModal(submission)} className="text-red-500 hover:bg-red-100 h-8 w-8" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions: Fill empty or Add new */}
                                    <div className="flex-shrink-0 w-full sm:w-auto">
                                        {emptySubmission ? (
                                             <button onClick={() => handleOpenSubmissionModal(report.id, emptySubmission)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm">
                                                <Plus className="h-5 w-5" />
                                                <span>Отправить отчёт</span>
                                            </button>
                                        ) : (
                                            isMultiSubmission && (
                                                <button onClick={() => handleOpenSubmissionModal(report.id)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all">
                                                    <Plus className="h-4 w-4" />
                                                    <span>Добавить ещё отчёт</span>
                                                </button>
                                            )
                                        )}
                                        {!emptySubmission && !isMultiSubmission && completedSubmissions.length === 0 && (
                                             <button onClick={() => handleOpenSubmissionModal(report.id)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm">
                                                <Plus className="h-5 w-5" />
                                                <span>Отправить отчёт</span>
                                            </button>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>

             {isSubmissionModalOpen && editingSubmission && (
                <ReportSubmissionModal
                    isOpen={isSubmissionModalOpen}
                    onClose={() => setIsSubmissionModalOpen(false)}
                    onSuccess={handleSubmissionSuccess}
                    submissionData={editingSubmission}
                />
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Удалить отчёт?"
                confirmButtonVariant="danger"
                confirmButtonText="Удалить"
            >
                Вы уверены, что хотите удалить этот отчёт? Это действие необратимо.
            </ConfirmationModal>
        </>
    );
};

export default DeputyReportsView;