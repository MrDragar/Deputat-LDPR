import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle, Plus, Edit3, Trash2, UserCheck, UserX, ExternalLink, Loader2, Check, X, MessageSquare, Calendar, Users, Settings, SquareCheckBig, FolderSearch, SquareX, UserCog, Filter, RefreshCw
} from 'lucide-react';
import type { Report, DeputyRecord, ReportRecord, DeputyLevel, ReportTheme, ReportPeriod } from '../../types';
import { format, parseISO, endOfDay } from 'date-fns';
import { useAlert } from '../../context/AlertContext';
import LinkSubmissionModal from './modals/LinkSubmissionModal';

interface RegionMonitoringDashboardProps {
  period: ReportPeriod;
  periodId: number;
  deputies: DeputyRecord[];
  reports: Report[];
  reportRecords: ReportRecord[];
  isAdmin: boolean;
  isDeputy?: boolean;
  onAddDeputy?: (level: DeputyLevel) => void;
  onDeleteDeputy?: (e: React.MouseEvent, id: number) => void;
  onToggleStatus?: (deputy: DeputyRecord) => void;
  onSaveLink: (recordId: number, link: string | null) => Promise<void>;
  onAdminCheck: (record: ReportRecord) => void;
  onFilteredCountChange?: (count: number) => void;
  headerContent?: React.ReactNode;
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

const getExpectedReports = (deputy: DeputyRecord, reports: Report[]) => {
  const isZS = deputy.level === 'ЗС' || (deputy.levelDisplay || '').includes('ЗС') || (deputy.levelDisplay || '').includes('Законодательн');
  return reports.filter(r => isZS || r.theme !== 'reg_event').sort((a, b) => (THEME_ORDER[a.theme] || 99) - (THEME_ORDER[b.theme] || 99));
};

const LinkDisplay = ({ 
  record, 
  report,
  deputy,
  period,
  isAdmin, 
  onAdminCheck,
  onOpenModal,
  onDelete
}: { 
  record: ReportRecord, 
  report: Report,
  deputy: DeputyRecord,
  period: ReportPeriod,
  isAdmin: boolean, 
  onAdminCheck: (record: ReportRecord) => void,
  onOpenModal: (record: ReportRecord, report: Report, deputy: DeputyRecord) => void,
  onDelete: (id: number) => Promise<void>
}) => {
  const isProcessed = record.status === 'processed';
  const isZeroScore = isProcessed && record.score === 0;
  const isOneScore = isProcessed && record.score === 1;
  const isInProcess = !isProcessed && record.link;
  const isPastDeadline = new Date() > endOfDay(parseISO(period.endDate));

  const blockBg = isZeroScore ? 'bg-red-50 border-red-200' : isOneScore ? 'bg-green-50 border-green-200' : isInProcess ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
  const linkColor = isZeroScore ? 'text-red-700' : isOneScore ? 'text-green-700' : isInProcess ? 'text-blue-700' : 'text-gray-700';
  const statusColor = isZeroScore ? 'text-red-600' : isOneScore ? 'text-green-600' : isInProcess ? 'text-blue-600' : 'text-gray-500';

  if (!record.link) {
    if (isAdmin || isProcessed) {
      if (isPastDeadline) {
        return <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Не сдано - время вышло</span>;
      }
      return <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Не сдано</span>;
    }
    if (isPastDeadline) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-[11px] font-bold border border-red-200 justify-center w-full">
          <Clock size={12} /> Время на загрузку вышло
        </div>
      );
    }
    return (
      <button 
        onClick={() => onOpenModal(record, report, deputy)}
        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-md transition-colors w-full justify-center"
      >
        <Plus size={12} /> Добавить ссылку
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className={`flex items-center justify-between w-full rounded-md px-3 py-2 group border ${blockBg}`}>
        <div className="flex items-center overflow-hidden">
          <a href={record.link} target="_blank" rel="noopener noreferrer" className={`text-[11px] hover:underline truncate ${linkColor}`}>
            {record.link.replace(/^https?:\/\//, '')}
          </a>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isAdmin && !isProcessed && !isPastDeadline && (
            <button onClick={() => onOpenModal(record, report, deputy)} className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Редактировать ссылку">
              <Edit3 size={14} />
            </button>
          )}
        </div>
      </div>
      
      {record.scoreExplanation && (
        <div className="mt-1 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-md text-xs text-gray-600 italic">
          {record.scoreExplanation}
        </div>
      )}

      {(record.status || record.score !== null) && (
        <div className="flex items-center justify-between px-1 mt-1">
          <div className="flex items-center gap-1">
            {!isProcessed && <Clock size={14} className="text-blue-600" />}
            <span className={`text-sm font-bold ${statusColor}`}>
              {isProcessed ? 'Проверено' : 'В процессе'}
            </span>
          </div>
          {isProcessed && record.score !== null && (
            <span className={`text-sm font-bold ${statusColor}`}>
              {record.score} {record.score === 1 ? 'балл' : 'баллов'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const DeputyCard = ({ 
  deputy, 
  index,
  period,
  reports, 
  reportRecords, 
  isAdmin, 
  isDeputy,
  onSaveLink, 
  onAdminCheck,
  onToggleStatus,
  onDeleteDeputy,
  onOpenModal,
  onDeleteLink
}: { 
  deputy: DeputyRecord, 
  index: number,
  period: ReportPeriod,
  reports: Report[], 
  reportRecords: ReportRecord[], 
  isAdmin: boolean,
  isDeputy?: boolean,
  onSaveLink: (id: number, link: string | null) => Promise<void>,
  onAdminCheck: (record: ReportRecord) => void,
  onToggleStatus?: (deputy: DeputyRecord) => void,
  onDeleteDeputy?: (e: React.MouseEvent, id: number) => void,
  onOpenModal: (record: ReportRecord, report: Report) => void,
  onDeleteLink: (id: number) => Promise<void>
}) => {
  const [expanded, setExpanded] = useState(isDeputy || false);
  
  const expectedReports = useMemo(() => getExpectedReports(deputy, reports), [deputy, reports]);
  
  // Group expected reports by theme
  const groupedReports = useMemo(() => {
    const groups: Record<string, { title: string, color: string, reports: Report[] }> = {};
    expectedReports.forEach(r => {
      const info = GET_GROUP_INFO(r.theme);
      if (!groups[info.title]) {
        groups[info.title] = { title: info.title, color: info.color, reports: [] };
      }
      groups[info.title].reports.push(r);
    });
    return Object.values(groups);
  }, [expectedReports]);

  // Calculate progress
  const progress = useMemo(() => {
    let total = expectedReports.length;
    let submitted = 0;
    
    expectedReports.forEach(r => {
      // Find record in deputy.reportRecords or reportRecords
      const record = (deputy.reportRecords || reportRecords).find(rr => 
        (typeof rr.report === 'object' ? rr.report.id === r.id : rr.report === r.id) &&
        (typeof rr.deputyRecord === 'object' ? rr.deputyRecord.id === deputy.id : rr.deputyRecord === deputy.id)
      );
      if (record && record.link) submitted++;
    });
    
    return { total, submitted, isComplete: total > 0 && submitted === total, isPartial: submitted > 0 && submitted < total };
  }, [expectedReports, deputy, reportRecords]);

  if (!deputy.isAvailable) {
    return (
      <div className="p-4 flex items-center justify-between opacity-60 bg-gray-50/50">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-100 rounded-full font-semibold text-slate-400 text-sm">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{deputy.levelDisplay || deputy.level}</span>
              {deputy.reason && <span className="text-[10px] text-red-500 italic">Причина: {deputy.reason}</span>}
            </div>
            <h4 className="text-sm font-bold text-gray-900 line-through">{deputy.fio}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onToggleStatus && (
            <button onClick={() => onToggleStatus(deputy)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Сделать обязанным сдавать отчеты">
              <UserCheck size={16} />
            </button>
          )}
          {isAdmin && onDeleteDeputy && deputy.deputy === null && (
            <button onClick={(e) => onDeleteDeputy(e, deputy.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-all ${expanded ? 'bg-blue-50/30' : 'bg-white'}`}>
      {/* Header (Collapsed View) */}
      <div 
        className="p-4 flex flex-col cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {!isDeputy && (
              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-600 rounded-full font-semibold text-white text-sm mt-0.5">
                {index + 1}
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full inline-block">
                  {deputy.levelDisplay || deputy.level}
                </span>
                {/* Status Indicator on mobile & desktop */}
                <div className="flex items-center justify-center">
                  {progress.isComplete ? (
                    <CheckCircle className="text-green-500" size={16} title="Все отчеты сданы" />
                  ) : progress.isPartial ? (
                    <Clock className="text-orange-500" size={16} title="Сдана часть отчетов" />
                  ) : (
                    <AlertCircle className="text-red-500" size={16} title="Отчеты не сданы" />
                  )}
                </div>
                {/* Actions (Desktop only) */}
                <div className="hidden sm:flex items-center gap-1 ml-2">
                  {onToggleStatus && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleStatus(deputy); }} 
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                      title="Изменить взаимодействие"
                    >
                      <UserCog size={16} />
                    </button>
                  )}
                  {isAdmin && onDeleteDeputy && deputy.deputy === null && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteDeputy(e, deputy.id); }} 
                      className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors" 
                      title="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-bold text-gray-900 truncate">{deputy.fio}</h4>
              
              {/* Progress Visuals */}
              <div className="flex flex-wrap items-center gap-3 text-sm mt-1.5">
                {groupedReports.map(group => {
                  let groupTotal = group.reports.length;
                  let groupSub = 0;
                  group.reports.forEach(r => {
                    const record = (deputy.reportRecords || reportRecords).find(rr => 
                      (typeof rr.report === 'object' ? rr.report.id === r.id : rr.report === r.id) &&
                      (typeof rr.deputyRecord === 'object' ? rr.deputyRecord.id === deputy.id : rr.deputyRecord === deputy.id)
                    );
                    if (record && record.link) groupSub++;
                  });
                  
                  return (
                    <div key={group.title} className="flex items-center gap-1">
                      <span className="text-gray-500">{group.title}:</span>
                      <span className={`font-bold ${groupSub === groupTotal ? 'text-green-600' : groupSub > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                        {groupSub}/{groupTotal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center shrink-0 ml-4 gap-1">
            <div className={`p-1.5 transition-transform duration-200 ${expanded ? 'text-blue-600 rotate-180' : 'text-gray-400'}`}>
              <ChevronDown size={20} />
            </div>
          </div>
        </div>

        {/* Actions with separator (Mobile only) */}
        <div className="sm:hidden mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
          {onToggleStatus && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleStatus(deputy); }} 
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <UserCog size={16} />
              Изменить взаимодействие
            </button>
          )}
          {isAdmin && onDeleteDeputy && deputy.deputy === null && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDeleteDeputy(e, deputy.id); }} 
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 size={16} />
              Удалить
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groupedReports.map(group => {
              let groupTotal = group.reports.length;
              let groupSub = 0;
              const recordsMap = new Map<number, ReportRecord>();
              
              group.reports.forEach(r => {
                const record = (deputy.reportRecords || reportRecords).find(rr => 
                  (typeof rr.report === 'object' ? rr.report.id === r.id : rr.report === r.id) &&
                  (typeof rr.deputyRecord === 'object' ? rr.deputyRecord.id === deputy.id : rr.deputyRecord === deputy.id)
                );
                if (record) {
                  recordsMap.set(r.id, record);
                  if (record.link) groupSub++;
                }
              });

              let bgClass = 'bg-red-500 text-white';
              const percentage = groupTotal > 0 ? groupSub / groupTotal : 0;
              if (percentage === 1) bgClass = 'bg-green-500 text-white';
              else if (percentage >= 0.75) bgClass = 'bg-emerald-400 text-white';
              else if (percentage > 0) bgClass = 'bg-orange-500 text-white';

              return (
                <div key={group.title} className="flex flex-col gap-2">
                  <div className={`px-3 py-2 rounded-lg flex items-center justify-between ${bgClass}`}>
                    <span className="text-xs font-bold uppercase tracking-wider">{group.title}</span>
                    <span className="text-xs font-bold">{groupSub}/{groupTotal}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.reports.map((report, idx) => {
                      const record = recordsMap.get(report.id);
                      const isSpecial = ['infoudar', 'vdpg'].includes(report.theme);
                      
                      return (
                        <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-2 shadow-sm relative">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col pr-6">
                              {isSpecial ? (
                                <>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">
                                    {format(parseISO(report.startDate), 'dd.MM')} — {format(parseISO(report.endDate), 'dd.MM')}
                                  </span>
                                  <span className="text-xs font-semibold text-gray-900 leading-tight">{report.name}</span>
                                </>
                              ) : (
                                <span className="text-xs font-semibold text-gray-900 leading-tight">
                                  {report.themeDisplay} {group.reports.length > 1 ? `№${idx + 1}` : ''}
                                </span>
                              )}
                            </div>
                            {isAdmin && record && record.link && (
                              <button 
                                onClick={() => onAdminCheck(record)} 
                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors shrink-0"
                                title="Проверить отчет"
                              >
                                <Settings size={16} />
                              </button>
                            )}
                          </div>
                          
                          {record ? (
                            <LinkDisplay 
                              record={record} 
                              report={report}
                              deputy={deputy}
                              period={period}
                              isAdmin={isAdmin} 
                              onAdminCheck={onAdminCheck} 
                              onOpenModal={onOpenModal}
                              onDelete={onDeleteLink}
                            />
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Запись не найдена</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function RegionMonitoringDashboard({
  period,
  periodId,
  deputies,
  reports,
  reportRecords,
  isAdmin,
  isDeputy,
  onAddDeputy,
  onDeleteDeputy,
  onToggleStatus,
  onSaveLink,
  onAdminCheck,
  onFilteredCountChange,
  headerContent
}: RegionMonitoringDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string[]>(['ЗС', 'АЦС', 'МСУ']);
  const [statusFilter, setStatusFilter] = useState<string[]>(['complete', 'partial', 'empty']);
  const [themeFilter, setThemeFilter] = useState<string[]>(['infoudar', 'event', 'vdpg']);
  const [detailedFilter, setDetailedFilter] = useState<{ category: string, status: string } | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const { showAlert } = useAlert();

  const [modalState, setModalState] = useState<{isOpen: boolean, record: ReportRecord | null, report: Report | null, deputy: DeputyRecord | null}>({isOpen: false, record: null, report: null, deputy: null});

  const handleOpenModal = (record: ReportRecord, report: Report, deputy: DeputyRecord) => {
    setModalState({ isOpen: true, record, report, deputy });
  };

  const handleDeleteLink = async (id: number) => {
    if (!window.confirm('Отозвать отчет?')) return;
    try {
      await onSaveLink(id, null);
      showAlert('success', 'Успешно', 'Ссылка отозвана');
    } catch (e) {
      showAlert('error', 'Ошибка', 'Не удалось отозвать ссылку');
    }
  };

  const handleSaveLinkModal = async (recordId: number, link: string | null) => {
    await onSaveLink(recordId, link);
    showAlert('success', 'Успешно', 'Ссылка успешно сохранена');
    setModalState({ isOpen: false, record: null, report: null });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setLevelFilter(['ЗС', 'АЦС', 'МСУ']);
    setStatusFilter(['complete', 'partial', 'empty']);
    setThemeFilter(['infoudar', 'event', 'vdpg']);
    setDetailedFilter(null);
  };

  // Calculate stats
  const stats = useMemo(() => {
    let complete = 0;
    let partial = 0;
    let empty = 0;

    const categoryStats = {
      infoudar: { submitted: 0, total: 0, inProcess: 0, checked: 0, score0: 0, score1: 0, notSubmitted: 0 },
      event: { submitted: 0, total: 0, inProcess: 0, checked: 0, score0: 0, score1: 0, notSubmitted: 0 },
      vdpg: { submitted: 0, total: 0, inProcess: 0, checked: 0, score0: 0, score1: 0, notSubmitted: 0 }
    };

    deputies.filter(d => d.isAvailable).forEach(deputy => {
      const expected = getExpectedReports(deputy, reports);
      if (expected.length === 0) return;

      let submitted = 0;
      expected.forEach(r => {
        const record = (deputy.reportRecords || reportRecords).find(rr => 
          (typeof rr.report === 'object' ? rr.report.id === r.id : rr.report === r.id) &&
          (typeof rr.deputyRecord === 'object' ? rr.deputyRecord.id === deputy.id : rr.deputyRecord === deputy.id)
        );
        const isSubmitted = !!(record && record.link);
        if (isSubmitted) submitted++;

        let category: 'infoudar' | 'event' | 'vdpg' | null = null;
        if (r.theme === 'infoudar') category = 'infoudar';
        else if (['event', 'reg_event', 'opt_event'].includes(r.theme)) category = 'event';
        else if (r.theme === 'vdpg') category = 'vdpg';

        if (category) {
          categoryStats[category].total++;
          if (isSubmitted) {
            categoryStats[category].submitted++;
            if (record.status === 'processed') {
              categoryStats[category].checked++;
              if (record.score === 0) categoryStats[category].score0++;
              if (record.score === 1) categoryStats[category].score1++;
            } else {
              categoryStats[category].inProcess++;
            }
          } else {
            categoryStats[category].notSubmitted++;
          }
        }
      });

      if (submitted === expected.length) complete++;
      else if (submitted > 0) partial++;
      else empty++;
    });

    return { complete, partial, empty, categoryStats };
  }, [deputies, reports, reportRecords]);

  // Filter deputies
  const filteredDeputies = useMemo(() => {
    return deputies.filter(deputy => {
      // Search
      if (searchQuery && !deputy.fio.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Level
      if (levelFilter.length > 0) {
        const levelMatch = levelFilter.some(l => deputy.level === l || (deputy.levelDisplay || '').includes(l));
        if (!levelMatch) return false;
      }

      // If not available, only show if statusFilter is empty
      if (!deputy.isAvailable) {
        return statusFilter.length === 0 && !detailedFilter;
      }

      const expected = getExpectedReports(deputy, reports);
      
      // Theme filter
      if (themeFilter.length > 0) {
        const hasTheme = expected.some(r => {
          if (themeFilter.includes('infoudar') && r.theme === 'infoudar') return true;
          if (themeFilter.includes('event') && ['event', 'reg_event', 'opt_event'].includes(r.theme)) return true;
          if (themeFilter.includes('vdpg') && r.theme === 'vdpg') return true;
          return false;
        });
        if (!hasTheme) return false;
      }

      // Detailed filter
      if (detailedFilter) {
        let match = false;
        expected.forEach(r => {
          let category: 'infoudar' | 'event' | 'vdpg' | null = null;
          if (r.theme === 'infoudar') category = 'infoudar';
          else if (['event', 'reg_event', 'opt_event'].includes(r.theme)) category = 'event';
          else if (r.theme === 'vdpg') category = 'vdpg';

          if (category === detailedFilter.category) {
            const record = (deputy.reportRecords || reportRecords).find(rr => 
              (typeof rr.report === 'object' ? rr.report.id === r.id : rr.report === r.id) &&
              (typeof rr.deputyRecord === 'object' ? rr.deputyRecord.id === deputy.id : rr.deputyRecord === deputy.id)
            );
            const isSubmitted = !!(record && record.link);

            if (detailedFilter.status === 'inProcess' && isSubmitted && record.status !== 'processed') match = true;
            if (detailedFilter.status === 'checked' && isSubmitted && record.status === 'processed') match = true;
            if (detailedFilter.status === 'score0' && isSubmitted && record.status === 'processed' && record.score === 0) match = true;
            if (detailedFilter.status === 'score1' && isSubmitted && record.status === 'processed' && record.score === 1) match = true;
            if (detailedFilter.status === 'notSubmitted' && !isSubmitted) match = true;
          }
        });
        if (!match) return false;
      }

      // Status filter
      if (statusFilter.length > 0) {
        let submitted = 0;
        expected.forEach(r => {
          const record = (deputy.reportRecords || reportRecords).find(rr => 
            (typeof rr.report === 'object' ? rr.report.id === r.id : rr.report === r.id) &&
            (typeof rr.deputyRecord === 'object' ? rr.deputyRecord.id === deputy.id : rr.deputyRecord === deputy.id)
          );
          if (record && record.link) submitted++;
        });

        const isComplete = submitted === expected.length && expected.length > 0;
        const isPartial = submitted > 0 && submitted < expected.length;
        const isEmpty = submitted === 0;

        if (!((statusFilter.includes('complete') && isComplete) || 
              (statusFilter.includes('partial') && isPartial) || 
              (statusFilter.includes('empty') && isEmpty))) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      return a.fio.localeCompare(b.fio);
    });
  }, [deputies, reports, reportRecords, searchQuery, levelFilter, statusFilter, themeFilter, detailedFilter]);

  const onFilteredCountChangeRef = useRef(onFilteredCountChange);
  useEffect(() => {
    onFilteredCountChangeRef.current = onFilteredCountChange;
  }, [onFilteredCountChange]);

  useEffect(() => {
    if (onFilteredCountChangeRef.current) {
      onFilteredCountChangeRef.current(filteredDeputies.length);
    }
  }, [filteredDeputies.length]);

  const toggleLevelFilter = (level: string) => {
    setLevelFilter(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  return (
    <div className="space-y-6">
      {/* Unified Header, Stats & Filters */}
      <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200 sm:shadow-sm space-y-6">
        {headerContent && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                {headerContent}
              </div>
              {!isDeputy && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm shrink-0"
                >
                  <RefreshCw size={18} />
                  Сбросить фильтры
                </button>
              )}
            </div>
            <hr className="border-gray-100" />
          </>
        )}

        {/* Quick Stats */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {[
            { id: 'infoudar', label: 'Инфоудары', data: stats.categoryStats.infoudar },
            { id: 'event', label: 'Мероприятия', data: stats.categoryStats.event },
            { id: 'vdpg', label: 'ВДПГ', data: stats.categoryStats.vdpg }
          ].map((item, index) => {
            const percent = item.data.total > 0 ? (item.data.submitted / item.data.total) * 100 : 0;
            let colorClass = 'bg-gray-200 text-gray-500';
            let textColorClass = 'text-gray-500';
            if (item.data.total > 0) {
              if (percent > 75) {
                colorClass = 'bg-green-500';
                textColorClass = 'text-green-600';
              } else if (percent >= 50) {
                colorClass = 'bg-orange-500';
                textColorClass = 'text-orange-500';
              } else {
                colorClass = 'bg-red-500';
                textColorClass = 'text-red-600';
              }
            }

            return (
              <React.Fragment key={item.id}>
                <div className="flex-1 flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-500">{item.label}</span>
                      <span className={`text-sm font-bold ${textColorClass}`}>
                        {item.data.submitted} / {item.data.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${colorClass}`} 
                        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {!isDeputy && item.data.total > 0 && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      {[
                        { key: 'inProcess', label: 'В ожидании', count: item.data.inProcess, color: 'text-blue-600' },
                        { key: 'checked', label: 'Проверено', count: item.data.checked, color: 'text-green-600' },
                        { key: 'score0', label: '0 баллов', count: item.data.score0, color: 'text-red-600', indent: true },
                        { key: 'score1', label: '1 балл', count: item.data.score1, color: 'text-green-600', indent: true },
                        { key: 'notSubmitted', label: 'Не сдано', count: item.data.notSubmitted, color: 'text-gray-500' }
                      ].map(stat => {
                        const isActive = detailedFilter?.category === item.id && detailedFilter?.status === stat.key;
                        return (
                          <div key={stat.key} className={`flex items-center justify-between text-xs ${stat.indent ? 'pl-4' : ''}`}>
                            <span className="text-gray-600">{stat.label}</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${stat.color}`}>{stat.count}</span>
                              <button 
                                onClick={() => setDetailedFilter(isActive ? null : { category: item.id, status: stat.key })}
                                className={`p-1 rounded transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                title="Фильтровать"
                              >
                                <Filter size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {index < 2 && (
                  <div className="hidden md:block w-px bg-gray-200 shrink-0"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <hr className="border-gray-100" />

        {/* Filters and Level */}
        {!isDeputy && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
              {/* Search */}
              <div className="md:col-span-8 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Поиск по ФИО..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-base"
                />
              </div>
              
              {/* Status Filter Dropdown */}
              <div className="md:col-span-4 relative">
                <button 
                  onClick={() => { setIsStatusDropdownOpen(!isStatusDropdownOpen); setIsThemeDropdownOpen(false); }}
                  className={`w-full h-full min-h-[50px] flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl text-base bg-white hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusFilter.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}
                >
                  <span className="truncate mr-2">
                    {statusFilter.length === 0 ? 'Все статусы' : 
                     statusFilter.length === 3 ? 'Все статусы' : 
                     `Статусы: ${statusFilter.length}`}
                  </span>
                  <ChevronDown size={20} className={`text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isStatusDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 pb-2">
                    <div className="p-2 border-b border-gray-100 flex justify-between items-center mb-2">
                      <button 
                        onClick={() => setStatusFilter(['complete', 'partial', 'empty'])}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        Выбрать все
                      </button>
                      <button 
                        onClick={() => setStatusFilter([])}
                        className="text-xs font-bold text-gray-500 hover:text-gray-700"
                      >
                        Снять все
                      </button>
                    </div>
                    <ul className="max-h-64 overflow-y-auto pr-1">
                      {[
                        { id: 'complete', label: 'Сдано полностью', count: stats.complete },
                        { id: 'partial', label: 'Частично сдано', count: stats.partial },
                        { id: 'empty', label: 'Не начато / Должники', count: stats.empty }
                      ].map(opt => {
                        const isSelected = statusFilter.includes(opt.id);
                        return (
                          <li key={opt.id}>
                            <label className="flex items-center justify-between cursor-pointer transition-colors p-2 rounded-md hover:bg-gray-50">
                              <div className="flex items-center space-x-3">
                                <div className="relative flex items-center justify-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setStatusFilter([...statusFilter, opt.id]);
                                      } else {
                                        setStatusFilter(statusFilter.filter(id => id !== opt.id));
                                      }
                                    }}
                                    className="peer appearance-none h-5 w-5 rounded border-2 border-gray-300 checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition-all"
                                  />
                                  <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                </div>
                                <span className="text-base font-medium text-gray-900 select-none leading-tight">{opt.label}</span>
                              </div>
                              <span className="text-sm font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full ml-3">{opt.count}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Уровень представительства</p>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: 'ЗС', label: 'Депутаты Законодательных собраний регионов' },
                  { value: 'АЦС', label: 'Депутаты административных центров регионов' },
                  { value: 'МСУ', label: 'Депутаты муниципальных образований' }
                ].map(level => {
                  const isSelected = levelFilter.includes(level.value);
                  const count = deputies.filter(d => d.level === level.label).length;
                  return (
                    <button 
                      key={level.value}
                      title={`${level.label} (${count})`}
                      onClick={() => toggleLevelFilter(level.value)}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                        isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level.value}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deputies List */}
      <div className="bg-white sm:border border-gray-200 sm:rounded-xl overflow-hidden divide-y divide-gray-200 sm:shadow-sm">
        {filteredDeputies.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">Ничего не найдено по заданным фильтрам</p>
          </div>
        ) : (
          filteredDeputies.map((deputy, index) => (
            <DeputyCard 
              key={deputy.id}
              deputy={deputy}
              index={index}
              period={period}
              reports={reports}
              reportRecords={reportRecords}
              isAdmin={isAdmin}
              isDeputy={isDeputy}
              onSaveLink={onSaveLink}
              onAdminCheck={onAdminCheck}
              onToggleStatus={onToggleStatus}
              onDeleteDeputy={onDeleteDeputy}
              onOpenModal={handleOpenModal}
              onDeleteLink={handleDeleteLink}
            />
          ))
        )}
      </div>

      {modalState.isOpen && modalState.record && modalState.report && modalState.deputy && (
        <LinkSubmissionModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, record: null, report: null, deputy: null })}
          report={modalState.report}
          record={modalState.record}
          deputy={modalState.deputy}
          onSave={handleSaveLinkModal}
        />
      )}
    </div>
  );
}
