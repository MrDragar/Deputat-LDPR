import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { ReportPeriod, Report, ReportRecord, DeputyRecord, User as UserType, ReportTheme } from '../../types';
import { 
  Link as LinkIcon, Edit, Trash2, Inbox, 
  ChevronDown, ChevronUp, Calendar, AlertCircle, Plus, Loader2,
  Zap, Flag, MessageSquare, LayoutGrid
} from 'lucide-react';
import IconButton from '../../components/ui/IconButton';
import ReportSubmissionModal from './modals/ReportSubmissionModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAlert } from '../../context/AlertContext';
import DeputyReportsSkeleton from '../../components/skeletons/DeputyReportsSkeleton';
import { format, isAfter, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

interface PeriodState {
    reports: Report[];
    myRecord: DeputyRecord | null;
    loading: boolean;
    error: boolean;
}

const DeputyReportsView: React.FC = () => {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    
    const [loading, setLoading] = useState(true);
    const [periods, setPeriods] = useState<ReportPeriod[]>([]);
    const [periodsData, setPeriodsData] = useState<Record<number, PeriodState>>({});
    const [expandedPeriods, setExpandedPeriods] = useState<Set<number>>(new Set());
    const [deputyProfile, setDeputyProfile] = useState<UserType | null>(null);

    const initPage = useCallback(async () => {
        try {
            setLoading(true);
            const [p, profile] = await Promise.all([
                api.getReportPeriods(),
                user?.user_id ? api.getUserById(user.user_id) : Promise.resolve(null)
            ]);
            
            setDeputyProfile(profile);

            const sorted = p.map(item => ({
                ...item,
                name: item.name || format(parseISO(item.startDate), 'LLLL yyyy', { locale: ru })
            })).sort((a, b) => parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime());
            
            setPeriods(sorted);

            if (sorted.length > 0) {
                const now = new Date();
                const active = sorted.find(p => isAfter(parseISO(p.endDate), now)) || sorted[0];
                togglePeriod(active.id, profile?.deputyForm?.region);
            }
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось загрузить периоды.');
        } finally {
            setLoading(false);
        }
    }, [user, showAlert]);

    useEffect(() => { initPage(); }, [initPage]);

    const fetchPeriodDetails = async (periodId: number, forcedRegionName?: string) => {
        if (periodsData[periodId]?.loading || (periodsData[periodId] && !periodsData[periodId].error)) return;

        setPeriodsData(prev => ({
            ...prev,
            [periodId]: { reports: [], myRecord: null, loading: true, error: false }
        }));

        try {
            const periodDetail = await api.getReportPeriodById(periodId);
            const myRegionName = (forcedRegionName || deputyProfile?.deputyForm?.region || '').trim();
            const myRegionEntry = periodDetail.regionReports?.find(rr => 
                rr.regionName.trim().toLowerCase() === myRegionName.toLowerCase()
            );

            let myFullRecord: DeputyRecord | null = null;
            if (myRegionEntry) {
                const regionDetail = await api.getRegionReportById(myRegionEntry.id);
                const myBriefRecord = regionDetail.deputiesRecords?.find(dr => 
                    Number(dr.deputy) === Number(user?.user_id)
                );
                if (myBriefRecord) {
                    myFullRecord = await api.getDeputyRecordById(myBriefRecord.id);
                }
            }

            setPeriodsData(prev => ({
                ...prev,
                [periodId]: { 
                    reports: periodDetail.reports || [], 
                    myRecord: myFullRecord, 
                    loading: false,
                    error: false
                }
            }));
        } catch (error) {
            setPeriodsData(prev => ({
                ...prev,
                [periodId]: { ...prev[periodId], loading: false, error: true }
            }));
            showAlert('error', 'Ошибка', 'Не удалось загрузить данные по отчетам.');
        }
    };

    const togglePeriod = (id: number, forcedRegionName?: string) => {
        const newSet = new Set(expandedPeriods);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
            fetchPeriodDetails(id, forcedRegionName);
        }
        setExpandedPeriods(newSet);
    };

    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
    const [pendingSubmission, setPendingSubmission] = useState<{ deputyRecordId: number, reportId: number, recordId: number, periodId: number, link?: string } | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmData, setConfirmData] = useState<{ link: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmission = (pId: number, drId: number, rId: number, recId: number, link?: string | null) => {
        setPendingSubmission({ 
            periodId: pId, 
            deputyRecordId: drId, 
            reportId: rId, 
            recordId: recId, 
            link: link || '' 
        });
        setIsSubmissionModalOpen(true);
    };

    const handleModalSuccess = (link: string) => {
        setIsSubmissionModalOpen(false);
        setConfirmData({ link });
        setIsConfirmModalOpen(true);
    };

    const handleFinalConfirm = async () => {
        if (!pendingSubmission || !confirmData) return;
        setIsSaving(true);
        try {
            const result = await api.updateReportRecord(pendingSubmission.recordId, {
                report: pendingSubmission.reportId,
                deputyRecord: pendingSubmission.deputyRecordId,
                link: confirmData.link
            });

            setPeriodsData(prev => {
                const pData = prev[pendingSubmission.periodId];
                if (!pData || !pData.myRecord) return prev;
                return {
                    ...prev,
                    [pendingSubmission.periodId]: {
                        ...pData,
                        myRecord: {
                            ...pData.myRecord,
                            reportRecords: pData.myRecord.reportRecords?.map(rr => 
                                rr.id === result.id ? result : rr
                            )
                        }
                    }
                };
            });
            showAlert('success', 'Успешно', 'Отчет сохранен.');
        } catch {
            showAlert('error', 'Ошибка', 'Не удалось сохранить.');
        } finally {
            setIsSaving(false);
            setIsConfirmModalOpen(false);
            setPendingSubmission(null);
            setConfirmData(null);
        }
    };

    const renderReportGroup = (
        title: string, 
        icon: React.ElementType, 
        reports: Report[], 
        myRecord: DeputyRecord | null, 
        periodId: number,
        showDates: boolean = true
    ) => {
        if (reports.length === 0) return null;

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2.5 px-1">
                    <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg">
                        {React.createElement(icon, { size: 18 })}
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{title}</h4>
                    <div className="h-px flex-1 bg-gray-100 ml-2"></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {reports.map(report => {
                        const submissions = myRecord?.reportRecords?.filter(rr => rr.report === report.id) || [];
                        if (submissions.length === 0) return null;

                        return (
                            <div key={report.id} className="space-y-2">
                                {/* Заголовок конкретного отчета (только если есть даты или это не серийное мероприятие) */}
                                {showDates && (
                                    <div className="px-1 mb-1">
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs font-bold text-gray-600">{report.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">
                                                Срок: {format(parseISO(report.startDate), 'dd.MM')} — {format(parseISO(report.endDate), 'dd.MM')}
                                            </p>
                                        </div>
                                        {report.description && (
                                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed italic">
                                                {report.description}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {submissions.map((rec, idx) => (
                                    <div key={rec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center transition-all hover:border-blue-200 hover:bg-white group/slot shadow-sm">
                                        <div className="flex-1 min-w-0 pr-4">
                                            {!showDates ? (
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${rec.link ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 leading-tight">
                                                            {report.themeDisplay}{submissions.length > 1 ? ` №${idx + 1}` : ''}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-medium">Ссылка на проведенное мероприятие</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${rec.link ? 'bg-green-500' : 'bg-slate-300 animate-pulse'}`}></div>
                                                    <p className="text-sm font-bold text-gray-700 truncate">
                                                        {submissions.length > 1 ? `Слот №${idx + 1}` : 'Загрузить отчет'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {rec.link ? (
                                                <div className="flex items-center gap-1.5">
                                                    <a href={rec.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-200 hover:bg-green-100 transition-colors">
                                                        <LinkIcon size={14} /> Посмотреть
                                                    </a>
                                                    <IconButton icon={Edit} onClick={() => handleSubmission(periodId, myRecord!.id, report.id, rec.id, rec.link)} className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50" />
                                                </div>
                                            ) : (
                                                <button onClick={() => handleSubmission(periodId, myRecord!.id, report.id, rec.id)} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95">
                                                    <Plus size={16} /> Сдать
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) return <DeputyReportsSkeleton />;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Моя отчётность</h1>
                <p className="mt-1 text-gray-500">Список ваших задач по отчетным периодам</p>
            </header>

            <div className="space-y-4">
                {periods.map(period => {
                    const isExp = expandedPeriods.has(period.id);
                    const pData = periodsData[period.id];
                    const now = new Date();
                    const isActive = isAfter(parseISO(period.endDate), now);

                    // Группировка отчетов по категориям
                    const infoudars = pData?.reports?.filter(r => r.theme === 'infoudar') || [];
                    const events = pData?.reports?.filter(r => ['event', 'reg_event', 'opt_event'].includes(r.theme)) || [];
                    const vdpgs = pData?.reports?.filter(r => r.theme === 'vdpg') || [];
                    const letters = pData?.reports?.filter(r => r.theme === 'letter') || [];

                    return (
                        <div key={period.id} className={`bg-white rounded-2xl border transition-all ${isExp ? 'ring-2 ring-blue-50 border-blue-200 shadow-lg' : 'border-gray-200 shadow-sm'}`}>
                            <button onClick={() => togglePeriod(period.id)} className="w-full flex items-center justify-between p-5 text-left group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 capitalize group-hover:text-blue-700 transition-colors">{period.name}</h3>
                                        <p className="text-xs text-gray-400 font-medium">
                                            {format(parseISO(period.startDate), 'd MMMM', { locale: ru })} — {format(parseISO(period.endDate), 'd MMMM yyyy', { locale: ru })}
                                        </p>
                                    </div>
                                    {isActive && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-green-100 text-green-700">Активен</span>
                                    )}
                                </div>
                                {isExp ? <ChevronUp className="text-gray-300" /> : <ChevronDown className="text-gray-300" />}
                            </button>

                            {isExp && (
                                <div className="p-5 border-t border-gray-50 space-y-10 animate-in slide-in-from-top-2 duration-300">
                                    {pData?.loading ? (
                                        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
                                    ) : pData?.error ? (
                                        <div className="py-6 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center gap-2">
                                            <AlertCircle size={24} />
                                            <p className="text-sm font-medium">Ошибка загрузки. Попробуйте обновить страницу.</p>
                                        </div>
                                    ) : !pData?.myRecord ? (
                                        <div className="py-12 text-center text-gray-400">
                                            <Inbox size={40} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">В этом периоде у вас нет назначенных отчетов</p>
                                        </div>
                                    ) : (
                                        <>
                                            {renderReportGroup('Инфоудары', Zap, infoudars, pData.myRecord, period.id)}
                                            {renderReportGroup('Мероприятия', LayoutGrid, events, pData.myRecord, period.id, false)}
                                            {renderReportGroup('ВДПГ', Flag, vdpgs, pData.myRecord, period.id)}
                                            {renderReportGroup('Письма и обращения', MessageSquare, letters, pData.myRecord, period.id)}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isSubmissionModalOpen && pendingSubmission && (
                <ReportSubmissionModal 
                    isOpen={isSubmissionModalOpen} 
                    onClose={() => setIsSubmissionModalOpen(false)} 
                    onSuccess={handleModalSuccess} 
                    submissionData={pendingSubmission} 
                />
            )}
            
            {isConfirmModalOpen && confirmData && (
                <ConfirmationModal 
                    isOpen={isConfirmModalOpen} 
                    onClose={() => setIsConfirmModalOpen(false)} 
                    onConfirm={handleFinalConfirm} 
                    title="Подтвердите ссылку" 
                    confirmButtonVariant="success"
                    confirmButtonText={isSaving ? "Сохранение..." : "Подтвердить"}
                >
                    <div className="space-y-3">
                        <p className="text-sm">Вы собираетесь сохранить следующую ссылку:</p>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] break-all text-left">
                            {confirmData.link}
                        </div>
                    </div>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default DeputyReportsView;