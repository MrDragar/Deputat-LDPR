import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { ReportPeriod, Report, ReportTheme } from '../../types';
import { Plus, Edit, Trash2, Calendar, Loader2, Map } from 'lucide-react';
import IconButton from '../../components/ui/IconButton';
import ReportPeriodModal from './modals/ReportPeriodModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import ReportTypeModal from './modals/ReportTypeModal';
import { useAlert } from '../../context/AlertContext';
import AdminReportsSkeleton from '../../components/skeletons/AdminReportsSkeleton';
import { format, parseISO, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

const THEME_ORDER: Record<ReportTheme, number> = {
    'infoudar': 1,
    'event': 2,
    'reg_event': 2,
    'opt_event': 2,
    'vdpg': 3,
    'letter': 4
};

const AdminReportsView: React.FC = () => {
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<ReportPeriod[]>([]);
  const [periodReports, setPeriodReports] = useState<Record<number, { reports: Report[], loading: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReportPeriod | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [currentPeriodForReport, setCurrentPeriodForReport] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const formatPeriodName = (startDate: string, endDate: string) => {
    const s = parseISO(startDate);
    const e = parseISO(endDate);
    if (isSameMonth(s, e)) {
        const name = format(s, 'LLLL yyyy', { locale: ru });
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    const monthS = format(s, 'LLLL', { locale: ru });
    const monthE = format(e, 'LLLL', { locale: ru });
    const yearE = format(e, 'yyyy', { locale: ru });
    const combined = `${monthS}-${monthE} ${yearE}`;
    return combined.charAt(0).toUpperCase() + combined.slice(1);
  };

  const fetchPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getReportPeriods();
      const namedPeriods = data.map(p => ({
          ...p,
          name: formatPeriodName(p.startDate, p.endDate)
      })).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      setPeriods(namedPeriods);
    } catch (error) {
      showAlert('error', 'Ошибка', 'Не удалось загрузить данные.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const loadReportsForPeriod = async (periodId: number) => {
    if (periodReports[periodId] && !periodReports[periodId].loading) return;
    setPeriodReports(prev => ({ ...prev, [periodId]: { reports: [], loading: true } }));
    try {
        const detail = await api.getReportPeriodById(periodId);
        const sortedReports = (detail.reports || []).sort((a, b) => {
            return (THEME_ORDER[a.theme] || 99) - (THEME_ORDER[b.theme] || 99);
        });
        setPeriodReports(prev => ({ 
            ...prev, 
            [periodId]: { reports: sortedReports, loading: false } 
        }));
    } catch {
        showAlert('error', 'Ошибка', 'Не удалось загрузить отчеты периода.');
    }
  };

  const handlePeriodSuccess = () => {
      setIsPeriodModalOpen(false);
      fetchPeriods();
  };
  
  const handleReportSuccess = (savedReport: Report) => {
      setIsReportModalOpen(false);
      // Reload period to ensure correct sorting and nested data
      loadReportsForPeriod(savedReport.reportPeriod);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.deleteReport(itemToDelete);
      showAlert('success', 'Успешно', 'Тип отчета удален.');
      // Refresh all lists to be sure
      setPeriodReports({});
      fetchPeriods();
    } catch {
       showAlert('error', 'Ошибка', 'Не удалось удалить.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  if (loading) return <AdminReportsSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление отчётностью</h1>
            <p className="mt-1 text-gray-500">Администрирование периодов и типов отчетов.</p>
          </div>
          <button onClick={() => { setEditingPeriod(null); setIsPeriodModalOpen(true); }} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:bg-blue-700 transition-colors">
            <Plus size={20} /> Новый период
          </button>
        </div>

        {periods.map(period => (
          <div key={period.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" onMouseEnter={() => loadReportsForPeriod(period.id)}>
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg border shadow-sm text-blue-600">
                    <Calendar size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 capitalize">{period.name}</h2>
                    <p className="text-sm text-gray-500">
                        {format(parseISO(period.startDate), 'dd.MM.yyyy')} — {format(parseISO(period.endDate), 'dd.MM.yyyy')}
                    </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate(`regions/${period.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm"
                >
                  <Map size={16} /> Регионы
                </button>
                <IconButton icon={Edit} onClick={() => { setEditingPeriod(period); setIsPeriodModalOpen(true); }} className="text-gray-400 hover:text-blue-600" title="Редактировать даты периода" />
              </div>
            </div>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-700">Слоты отчетов</h3>
                    <button onClick={() => { setEditingReport(null); setCurrentPeriodForReport(period.id); setIsReportModalOpen(true); }} className="text-sm text-blue-600 font-bold hover:underline">
                        + Добавить слот
                    </button>
                </div>
                {periodReports[period.id]?.loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" /></div>
                ) : periodReports[period.id]?.reports.length > 0 ? (
                    <ul className="space-y-2">
                        {periodReports[period.id].reports.map(report => (
                            <li key={report.id} className="p-3 bg-slate-50 border rounded-lg flex justify-between items-center hover:border-blue-200 transition-colors">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800 truncate">{report.name}</span>
                                        <span className="flex-shrink-0 text-[10px] bg-white border text-gray-500 px-2 py-0.5 rounded-full uppercase font-extrabold tracking-tight">{report.themeDisplay}</span>
                                    </div>
                                    {report.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">{report.description}</p>}
                                </div>
                                <div className="flex gap-1">
                                    <IconButton icon={Edit} onClick={() => { setEditingReport(report); setCurrentPeriodForReport(period.id); setIsReportModalOpen(true); }} className="h-8 w-8 text-gray-400 hover:text-blue-600" />
                                    <IconButton icon={Trash2} onClick={() => { setItemToDelete(report.id); setIsDeleteModalOpen(true); }} className="h-8 w-8 text-red-300 hover:text-red-600" />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center py-6 text-gray-400 text-sm italic bg-slate-50/50 rounded-lg border border-dashed border-gray-200">В этом периоде пока нет созданных слотов отчётов</p>
                )}
            </div>
          </div>
        ))}
        
        <ReportPeriodModal isOpen={isPeriodModalOpen} onClose={() => setIsPeriodModalOpen(false)} onSuccess={handlePeriodSuccess} period={editingPeriod} />
        {isReportModalOpen && currentPeriodForReport && (
            <ReportTypeModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSuccess={handleReportSuccess} report={editingReport} periodId={currentPeriodForReport} />
        )}
        <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDelete} title="Удалить слот?" confirmButtonVariant="danger">Вы уверены? Это действие нельзя отменить.</ConfirmationModal>
    </div>
  );
};

export default AdminReportsView;