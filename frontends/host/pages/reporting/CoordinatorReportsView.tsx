import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { CoordinatorViewData, ReportRecord, ReportTheme } from '../../types';
import { Plus, Users, Link as LinkIcon, Edit, Trash2 } from 'lucide-react';
import IconButton from '../../components/ui/IconButton';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import ReportSubmissionModal from './modals/ReportSubmissionModal';
import { useAlert } from '../../context/AlertContext';
import CoordinatorReportsSkeleton from '../../components/skeletons/CoordinatorReportsSkeleton';

const CoordinatorReportsView: React.FC = () => {
    const { user } = useAuth();
    const [data, setData] = useState<CoordinatorViewData | null>(null);
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
                const responseData = await api.getCoordinatorViewData(user.user_id);
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

    const sortedDeputies = useMemo(() => {
        if (!data?.deputyRecords) return [];
        const coordinator = data.deputyRecords.find(d => d.deputy === user?.user_id);
        const others = data.deputyRecords.filter(d => d.deputy !== user?.user_id).sort((a, b) => a.fio.localeCompare(b.fio));
        if (coordinator) {
            return [{ ...coordinator, fio: `${coordinator.fio} (я)` }, ...others];
        }
        return others;
    }, [data?.deputyRecords, user?.user_id]);

    const getSubmissions = (deputyRecordId: number, reportId: number): ReportRecord[] => {
        return data?.reportRecords.filter(s => s.deputyRecord === deputyRecordId && s.report === reportId) || [];
    };

    // Modal Handlers
    const handleOpenSubmissionModal = (deputyRecordId: number, reportId: number, submission?: ReportRecord) => {
        setEditingSubmission({ 
            deputyRecordId, 
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
            showAlert('success', 'Успешно', 'Отчёт удалён.');
            
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
        return <CoordinatorReportsSkeleton />;
    }

    return (
        <>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Отчётность по региону</h1>
                        <p className="mt-1 text-gray-500">Период: <span className="font-semibold">{data.period.name}</span></p>
                    </div>
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-slate-200 text-slate-700 cursor-not-allowed" disabled>
                        <Users className="h-5 w-5" />
                        <span>Управление депутатами</span>
                    </button>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 font-semibold w-1/3">Депутат</th>
                                {data.reports.map(rt => (
                                    <th key={rt.id} scope="col" className="px-6 py-3 font-semibold text-center align-top">
                                        <div>{rt.name}</div>
                                        {rt.theme === 'opt_event' && <div className="text-[10px] font-normal text-gray-400 normal-case">Опционально</div>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDeputies.map(deputy => (
                                <tr key={deputy.id} className="bg-white border-b hover:bg-gray-50">
                                    <th scope="row" className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap align-top">
                                        {deputy.fio}
                                    </th>
                                    {data.reports.map(report => {
                                        const submissions = getSubmissions(deputy.id, report.id);
                                        const emptySubmission = submissions.find(s => !s.link);
                                        const completedSubmissions = submissions.filter(s => s.link);
                                        const isMultiSubmission = (['event', 'opt_event'] as ReportTheme[]).includes(report.theme);

                                        return (
                                            <td key={`${deputy.id}-${report.id}`} className="px-4 py-4 align-top">
                                                <div className="flex flex-col gap-2 items-center">
                                                    {/* Existing submissions list */}
                                                    {completedSubmissions.map(submission => (
                                                        <div key={submission.id} className="flex items-center gap-1 group w-full justify-center animate-in fade-in zoom-in-95 duration-200">
                                                            <a href={submission.link!} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors" title={submission.link!}>
                                                                <LinkIcon size={16} />
                                                            </a>
                                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleOpenSubmissionModal(deputy.id, report.id, submission)} className="p-1 text-gray-400 hover:text-gray-700"><Edit size={14}/></button>
                                                                <button onClick={() => handleOpenDeleteModal(submission)} className="p-1 text-red-300 hover:text-red-600"><Trash2 size={14}/></button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Add Button logic */}
                                                    {emptySubmission ? (
                                                         <button onClick={() => handleOpenSubmissionModal(deputy.id, report.id, emptySubmission)} className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 w-full max-w-[120px]">
                                                            <Plus className="h-3 w-3" />
                                                            <span>Сдать</span>
                                                        </button>
                                                    ) : (
                                                        (isMultiSubmission || completedSubmissions.length === 0) && (
                                                             <button onClick={() => handleOpenSubmissionModal(deputy.id, report.id)} className={`p-1.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-colors ${completedSubmissions.length > 0 ? 'mt-1' : ''}`} title="Добавить отчет">
                                                                <Plus className="h-4 w-4" />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

export default CoordinatorReportsView;