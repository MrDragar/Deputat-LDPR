import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { ReportPeriod, Report, ReportRecord, DeputyRecord, User as UserType, ReportTheme } from '../../types';
import { 
  Plus, Users, Link as LinkIcon, Edit, Trash2, 
  AlertCircle, ChevronDown, ChevronUp, Calendar, Inbox, Loader2
} from 'lucide-react';
import IconButton from '../../components/ui/IconButton';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import ReportSubmissionModal from './modals/ReportSubmissionModal';
import { useAlert } from '../../context/AlertContext';
import CoordinatorReportsSkeleton from '../../components/skeletons/CoordinatorReportsSkeleton';
import { format, isAfter, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

interface PeriodData {
    reports: Report[];
    deputyRecords: DeputyRecord[];
    reportRecords: ReportRecord[];
    loading: boolean;
    error: boolean;
}

const THEME_ORDER: Record<ReportTheme, number> = {
    'infoudar': 1,
    'event': 2,
    'reg_event': 3,
    'opt_event': 4,
    'vdpg': 5,
    'letter': 6
};

const GET_GROUP_INFO = (theme: ReportTheme) => {
    if (theme === 'infoudar') return { title: 'Инфоудары', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (['event', 'reg_event', 'opt_event'].includes(theme)) return { title: 'Мероприятия', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (theme === 'vdpg') return { title: 'ВДПГ', color: 'bg-red-50 text-red-700 border-red-200' };
    return { title: 'Прочее', color: 'bg-gray-50 text-gray-700 border-gray-200' };
};

const sortDeputies = (a: DeputyRecord, b: DeputyRecord) => {
    // 1. Сначала взаимодействующие (isAvailable: true)
    if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
    }
    // 2. Сначала те, у кого есть привязка к пользователю (deputy != null)
    const aHasUser = a.deputy !== null;
    const bHasUser = b.deputy !== null;
    if (aHasUser !== bHasUser) {
        return aHasUser ? -1 : 1;
    }
    // 3. По ФИО (А-Я)
    return a.fio.localeCompare(b.fio);
};

const CoordinatorReportsView: React.FC = () => {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    
    const [periods, setPeriods] = useState<ReportPeriod[]>([]);
    const [periodsData, setPeriodsData] = useState<Record<number, PeriodData>>({});
    const [expandedPeriods, setExpandedPeriods] = useState<Set<number>>(new Set());
    const [initialLoading, setInitialLoading] = useState(true);
    const [coordinatorProfile, setCoordinatorProfile] = useState<UserType | null>(null);

    const initPage = useCallback(async () => {
        try {
            setInitialLoading(true);
            const [p, profile] = await Promise.all([
                api.getReportPeriods(),
                user?.user_id ? api.getUserById(user.user_id) : Promise.resolve(null)
            ]);
            
            if (profile) {
                setCoordinatorProfile(profile);
            }

            const sortedPeriods = p.map(item => ({
                ...item,
                name: item.name || format(parseISO(item.startDate), 'LLLL yyyy', { locale: ru })
            })).sort((a, b) => parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime());
            
            setPeriods(sortedPeriods);

            if (sortedPeriods.length > 0) {
                const now = new Date();
                const activePeriod = sortedPeriods.find(per => isAfter(parseISO(per.endDate), now)) || sortedPeriods[0];
                togglePeriod(activePeriod.id, profile?.deputyForm?.region);
            }
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось загрузить данные отчетности.');
        } finally {
            setInitialLoading(false);
        }
    }, [user, showAlert]);

    useEffect(() => {
        initPage();
    }, [initPage]);

    const fetchPeriodDetails = async (periodId: number, forcedRegionName?: string) => {
        if (periodsData[periodId]?.loading || (periodsData[periodId] && !periodsData[periodId].error)) return;

        setPeriodsData(prev => ({
            ...prev,
            [periodId]: { loading: true, error: false, reports: [], deputyRecords: [], reportRecords: [] }
        }));

        try {
            const periodDetail = await api.getReportPeriodById(periodId);
            const reports = periodDetail.reports || [];
            const myRegionName = (forcedRegionName || coordinatorProfile?.deputyForm?.region || '').trim();
            const myRegionEntry = periodDetail.regionReports?.find(rr => 
                rr.regionName.trim().toLowerCase() === myRegionName.toLowerCase()
            );

            if (!myRegionEntry) {
                setPeriodsData(prev => ({
                    ...prev,
                    [periodId]: { loading: false, error: false, reports, deputyRecords: [], reportRecords: [] }
                }));
                return;
            }

            const regionDetail = await api.getRegionReportById(myRegionEntry.id);
            const deputySummaries = regionDetail.deputiesRecords || [];
            const deputyDetailsPromises = deputySummaries.map(ds => api.getDeputyRecordById(ds.id));
            const fullDeputies = await Promise.all(deputyDetailsPromises);
            const allReportRecords = fullDeputies.flatMap(fd => fd.reportRecords || []);

            setPeriodsData(prev => ({
                ...prev,
                [periodId]: {
                    loading: false,
                    error: false,
                    reports,
                    deputyRecords: fullDeputies,
                    reportRecords: allReportRecords
                }
            }));
        } catch (error) {
            setPeriodsData(prev => ({
                ...prev,
                [periodId]: { ...prev[periodId], loading: false, error: true }
            }));
            showAlert('error', 'Ошибка', 'Не удалось загрузить детальные данные по региону.');
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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<{ record: ReportRecord, periodId: number } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenSubmissionModal = (periodId: number, deputyRecordId: number, reportId: number, submission: ReportRecord) => {
        setPendingSubmission({ 
            deputyRecordId, reportId, recordId: submission.id, periodId, link: submission.link || ''
        });
        setIsSubmissionModalOpen(true);
    };

    const handleSubmissionSuccess = (providedLink: string) => {
        setIsSubmissionModalOpen(false);
        setConfirmData({ link: providedLink });
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
                return {
                    ...prev,
                    [pendingSubmission.periodId]: {
                        ...pData,
                        reportRecords: pData.reportRecords.map(r => r.id === result.id ? result : r)
                    }
                };
            });

            showAlert('success', 'Успешно', 'Отчёт сохранен.');
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось сохранить.');
        } finally {
            setIsSaving(false);
            setIsConfirmModalOpen(false);
            setPendingSubmission(null);
            setConfirmData(null);
        }
    };

    const handleOpenDeleteModal = (periodId: number, record: ReportRecord) => {
        setRecordToDelete({ record, periodId });
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!recordToDelete) return;
        setIsSaving(true);
        try {
            const result = await api.updateReportRecord(recordToDelete.record.id, {
                report: recordToDelete.record.report,
                deputyRecord: recordToDelete.record.deputyRecord,
                link: null
            });
            
            setPeriodsData(prev => {
                const pData = prev[recordToDelete.periodId];
                return {
                    ...prev,
                    [recordToDelete.periodId]: {
                        ...pData,
                        reportRecords: pData.reportRecords.map(r => r.id === result.id ? result : r)
                    }
                };
            });
            
            showAlert('success', 'Успешно', 'Отчёт отозван.');
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось отозвать.');
        } finally {
            setIsSaving(false);
            setIsDeleteModalOpen(false);
            setRecordToDelete(null);
        }
    };

    const renderLevelTable = (periodId: number, levelLabel: string, deputies: DeputyRecord[], reports: Report[], reportRecords: ReportRecord[], isZS: boolean) => {
        if (deputies.length === 0) return null;

        const sortedReports = [...reports]
            .filter(r => isZS || r.theme !== 'reg_event')
            .sort((a, b) => (THEME_ORDER[a.theme] || 99) - (THEME_ORDER[b.theme] || 99));

        const groups: { title: string, color: string, count: number }[] = [];
        sortedReports.forEach((report) => {
            const info = GET_GROUP_INFO(report.theme);
            if (groups.length > 0 && groups[groups.length - 1].title === info.title) {
                groups[groups.length - 1].count++;
            } else {
                groups.push({ ...info, count: 1 });
            }
        });

        const sortedDeputies = [...deputies].sort(sortDeputies);

        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{levelLabel}</h4>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{deputies.length}</span>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-auto max-h-[700px] relative">
                    <table className="w-full min-w-[800px] text-sm text-left border-collapse table-auto">
                        <thead className="sticky top-0 z-30">
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th rowSpan={2} scope="col" className="px-6 py-3 font-bold sticky left-0 bg-gray-50 z-40 w-[250px] border-r border-gray-200">
                                    Депутат
                                </th>
                                {groups.map((group, idx) => (
                                    <th 
                                        key={`${group.title}-${idx}`} 
                                        colSpan={group.count} 
                                        className={`px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest border-b border-gray-200 ${group.color} ${idx > 0 ? 'border-l-2 border-gray-300' : 'border-l border-gray-200'}`}
                                    >
                                        {group.title}
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {sortedReports.map((report, idx) => {
                                    const isSpecial = ['infoudar', 'vdpg'].includes(report.theme);
                                    const groupInfo = GET_GROUP_INFO(report.theme);
                                    const isFirstInGroup = idx === 0 || GET_GROUP_INFO(sortedReports[idx-1].theme).title !== groupInfo.title;

                                    return (
                                        <th 
                                            key={report.id} 
                                            scope="col" 
                                            className={`px-3 py-3 font-bold text-center min-w-[160px] bg-gray-50/80 backdrop-blur-sm ${isFirstInGroup && idx > 0 ? 'border-l-2 border-gray-300' : 'border-l border-gray-100'}`}
                                        >
                                            <div className="flex flex-col items-center gap-0.5">
                                                {isSpecial ? (
                                                    <>
                                                        <span className="text-gray-400 text-[8px] font-bold uppercase mb-0.5">
                                                            {format(parseISO(report.startDate), 'dd.MM')} — {format(parseISO(report.endDate), 'dd.MM')}
                                                        </span>
                                                        <span className="text-gray-900 leading-tight normal-case text-[11px] font-bold line-clamp-2 px-1 text-center">
                                                            {report.name}
                                                        </span>
                                                        {report.description && (
                                                            <span className="text-gray-400 text-[9px] font-normal leading-tight mt-1 line-clamp-2 px-1 italic">
                                                                {report.description}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-900 leading-tight text-center text-[11px]">{report.themeDisplay}</span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedDeputies.map(deputy => (
                                <tr key={deputy.id} className="hover:bg-blue-50/20 transition-colors">
                                    <th scope="row" className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 border-r border-gray-100">
                                        <div className="flex flex-col min-w-0 text-left">
                                            <span className={`text-sm truncate ${!deputy.isAvailable ? 'text-gray-400 line-through' : ''}`}>{deputy.fio}</span>
                                            {!deputy.isAvailable && deputy.reason && (
                                                <span className="text-[10px] text-red-500 font-bold mt-1 leading-tight italic bg-red-50 px-1.5 py-0.5 rounded-sm whitespace-normal max-w-[200px]">
                                                    Причина: {deputy.reason}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    {deputy.isAvailable ? (
                                        sortedReports.map((report, idx) => {
                                            const submissions = reportRecords.filter(rr => rr.report === report.id && rr.deputyRecord === deputy.id);
                                            const isNumbered = ['event', 'opt_event', 'reg_event'].includes(report.theme);
                                            const groupInfo = GET_GROUP_INFO(report.theme);
                                            const isFirstInGroup = idx === 0 || GET_GROUP_INFO(sortedReports[idx-1].theme).title !== groupInfo.title;

                                            return (
                                                <td key={`${deputy.id}-${report.id}`} className={`px-2 py-3 text-center ${isFirstInGroup && idx > 0 ? 'border-l-2 border-gray-200 bg-slate-50/30' : 'border-l border-gray-100'}`}>
                                                    <div className="flex flex-col gap-1.5 items-center">
                                                        {submissions.length > 0 ? submissions.map((sub, sIdx) => (
                                                            <div key={sub.id} className="w-full max-w-[140px]">
                                                                {sub.link ? (
                                                                    <div className="flex items-center gap-1 group">
                                                                        <a href={sub.link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors border border-green-200 truncate">
                                                                            <LinkIcon size={12} /> {isNumbered && submissions.length > 1 ? `№${sIdx + 1}` : 'Сдан'}
                                                                        </a>
                                                                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button onClick={() => handleOpenSubmissionModal(periodId, deputy.id, report.id, sub)} className="p-0.5 text-blue-500 hover:bg-blue-50 rounded"><Edit size={12}/></button>
                                                                            <button onClick={() => handleOpenDeleteModal(periodId, sub)} className="p-0.5 text-red-400 hover:bg-red-50 rounded"><Trash2 size={12}/></button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button onClick={() => handleOpenSubmissionModal(periodId, deputy.id, report.id, sub)} className="w-full flex items-center justify-center gap-1 py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg bg-slate-100 text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                                                                        <Plus size={12} /> <span>{isNumbered && submissions.length > 1 ? `№${sIdx + 1}` : 'Сдать'}</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )) : (
                                                            <span className="text-[10px] text-gray-300">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })
                                    ) : (
                                        <td colSpan={sortedReports.length} className="px-6 py-4 bg-gray-50/50 text-center">
                                            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-widest">
                                                Отчеты не требуются
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (initialLoading) return <CoordinatorReportsSkeleton />;

    return (
        <div className="max-full space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Мониторинг региона</h1>
                    <p className="mt-1 text-gray-500">Управление отчетами депутатов вашего региона по периодам</p>
                    {coordinatorProfile?.deputyForm?.region && (
                        <p className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100">
                            Регион: {coordinatorProfile.deputyForm.region}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                     <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Координатор</span>
                        <span className="text-sm font-semibold text-gray-700">{user?.login}</span>
                    </div>
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-full">
                        <Users size={24} />
                    </div>
                </div>
            </header>

            <div className="space-y-4">
                {periods.map(period => {
                    const isExpanded = expandedPeriods.has(period.id);
                    const periodDetails = periodsData[period.id];
                    const now = new Date();
                    const isActive = isAfter(parseISO(period.endDate), now);

                    return (
                        <div key={period.id} className={`bg-white rounded-2xl border transition-all ${isExpanded ? 'ring-2 ring-blue-50 border-blue-200 shadow-lg' : 'border-gray-200 shadow-sm'}`}>
                            <button onClick={() => togglePeriod(period.id)} className="w-full flex items-center justify-between p-5 text-left focus:outline-none group">
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
                                <div className="flex items-center gap-3">
                                    {periodDetails?.loading && <Loader2 size={18} className="animate-spin text-blue-500" />}
                                    {isExpanded ? <ChevronUp className="text-gray-300" /> : <ChevronDown className="text-gray-300" />}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="p-5 border-t border-gray-50 space-y-8 animate-in slide-in-from-top-2 duration-300 min-h-[100px]">
                                    {periodDetails?.loading ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                                            <Loader2 size={32} className="animate-spin text-blue-600" />
                                            <p className="text-sm font-medium">Загрузка данных региона...</p>
                                        </div>
                                    ) : periodDetails?.error ? (
                                        <div className="py-8 text-center bg-red-50 rounded-xl border border-red-100">
                                            <AlertCircle className="mx-auto text-red-400 mb-2" />
                                            <p className="text-sm text-red-600">Ошибка при загрузке. Попробуйте снова.</p>
                                        </div>
                                    ) : periodDetails?.deputyRecords.length === 0 ? (
                                        <div className="py-12 text-center text-gray-400">
                                            <Inbox size={40} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">Нет зарегистрированных депутатов в вашем регионе</p>
                                        </div>
                                    ) : (
                                        <>
                                            {renderLevelTable(period.id, 'Законодательное Собрание (ЗС)', periodDetails.deputyRecords.filter(d => d.level === 'ЗС' || (d.levelDisplay || '').includes('ЗС') || (d.levelDisplay || '').includes('Законодательн')), periodDetails.reports, periodDetails.reportRecords, true)}
                                            {renderLevelTable(period.id, 'Административный Центр (АЦС)', periodDetails.deputyRecords.filter(d => d.level === 'АЦС' || (d.levelDisplay || '').includes('АЦС') || (d.levelDisplay || '').includes('административн')), periodDetails.reports, periodDetails.reportRecords, false)}
                                            {renderLevelTable(period.id, 'Местное Самоуправление (МСУ)', periodDetails.deputyRecords.filter(d => d.level === 'МСУ' || (d.levelDisplay || '').includes('МСУ') || (d.levelDisplay || '').includes('муниципальн')), periodDetails.reports, periodDetails.reportRecords, false)}
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
                    onSuccess={handleSubmissionSuccess}
                    submissionData={pendingSubmission}
                />
            )}

            {isConfirmModalOpen && confirmData && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleFinalConfirm}
                    title="Подтвердите сохранение"
                    confirmButtonVariant="success"
                    confirmButtonText={isSaving ? "Сохранение..." : "Подтвердить"}
                >
                    <div className="space-y-3">
                        <p className="text-sm">Вы собираетесь сохранить отчёт:</p>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] break-all text-left">
                            {confirmData.link}
                        </div>
                    </div>
                </ConfirmationModal>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Отозвать отчёт?"
                confirmButtonVariant="danger"
                confirmButtonText={isSaving ? "Отзыв..." : "Отозвать"}
            >
                Вы уверены, что хотите очистить ссылку в этом слоте?
            </ConfirmationModal>
        </div>
    );
};

export default CoordinatorReportsView;