import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import type { ReportPeriod, Report, AdminViewData } from '../../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import IconButton from '../../components/ui/IconButton';
import ReportPeriodModal from './modals/ReportPeriodModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import ReportTypeModal from './modals/ReportTypeModal';
import { useAlert } from '../../context/AlertContext';
import AdminReportsSkeleton from '../../components/skeletons/AdminReportsSkeleton';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';

const AdminReportsView: React.FC = () => {
  const [viewData, setViewData] = useState<AdminViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  // Modal States
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReportPeriod | null>(null);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [currentPeriodForReport, setCurrentPeriodForReport] = useState<number | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'report'; reportId: number} | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAdminViewData();
      setViewData(data);
    } catch (error) {
      showAlert('error', 'Ошибка', 'Не удалось загрузить данные для отчётности.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const reportsByPeriod = useMemo(() => {
    if (!viewData) return new Map<number, Report[]>();
    return viewData.reports.reduce((acc, report) => {
        const periodId = report.reportPeriod;
        if (!acc.has(periodId)) {
            acc.set(periodId, []);
        }
        acc.get(periodId)!.push(report);
        return acc;
    }, new Map<number, Report[]>());
  }, [viewData]);
  
  // Handlers for Period Modal
  const handleOpenNewPeriodModal = () => {
    setEditingPeriod(null);
    setIsPeriodModalOpen(true);
  };
  
  const handleOpenEditPeriodModal = (period: ReportPeriod) => {
    setEditingPeriod(period);
    setIsPeriodModalOpen(true);
  };

  const handlePeriodSuccess = (savedPeriod: ReportPeriod) => {
      setIsPeriodModalOpen(false);
      
      setViewData(prev => {
          if (!prev) return null;
          
          // Generate name locally if backend returns it without name or we want to ensure consistency
          const periodWithName = {
              ...savedPeriod,
              name: savedPeriod.name || `${format(new Date(savedPeriod.startDate), 'LLLL yyyy', { locale: ru })}`
          };

          const isEdit = prev.periods.some(p => p.id === savedPeriod.id);
          let newPeriods;
          
          if (isEdit) {
              newPeriods = prev.periods.map(p => p.id === savedPeriod.id ? periodWithName : p);
          } else {
              newPeriods = [periodWithName, ...prev.periods];
          }

          // Sort by start date descending
          newPeriods.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

          return { ...prev, periods: newPeriods };
      });
  };
  
  // Handlers for Report Modal
  const handleOpenNewReportModal = (periodId: number) => {
    setEditingReport(null);
    setCurrentPeriodForReport(periodId);
    setIsReportModalOpen(true);
  };

  const handleOpenEditReportModal = (report: Report) => {
    setEditingReport(report);
    setCurrentPeriodForReport(report.reportPeriod);
    setIsReportModalOpen(true);
  };

  const handleReportSuccess = (savedReport: Report) => {
      setIsReportModalOpen(false);
      setViewData(prev => {
          if (!prev) return null;
          const isEdit = prev.reports.some(r => r.id === savedReport.id);
          let newReports;
          if (isEdit) {
              newReports = prev.reports.map(r => r.id === savedReport.id ? savedReport : r);
          } else {
              newReports = [...prev.reports, savedReport];
          }
          return { ...prev, reports: newReports };
      });
  };

  // Handlers for Delete Modal
  const handleOpenDeleteModal = (reportId: number) => {
    setItemToDelete({ type: 'report', reportId });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api.deleteReport(itemToDelete.reportId);
      showAlert('success', 'Успешно', 'Тип отчета удален.');
      
      // Update local state instead of refetching
      setViewData(prev => {
          if (!prev) return null;
          return {
              ...prev,
              reports: prev.reports.filter(r => r.id !== itemToDelete.reportId)
          };
      });

    } catch (error) {
       showAlert('error', 'Ошибка', 'Не удалось удалить элемент.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };


  if (loading) {
    return <AdminReportsSkeleton />;
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Управление отчётностью</h1>
            <p className="mt-1 text-gray-500">Создавайте и редактируйте отчётные периоды и типы отчётов.</p>
          </div>
          <button 
            onClick={handleOpenNewPeriodModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>Новый период</span>
          </button>
        </div>

        {viewData && viewData.periods.length > 0 ? viewData.periods.map(period => (
          <div key={period.id} className="bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{period.name}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(period.startDate + 'T00:00:00').toLocaleDateString('ru-RU')} - {new Date(period.endDate + 'T00:00:00').toLocaleDateString('ru-RU')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <IconButton icon={Edit} aria-label="Редактировать период" onClick={() => handleOpenEditPeriodModal(period)} className="text-gray-500 hover:bg-gray-100 hover:text-gray-900" />
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-semibold text-gray-700">Типы отчётов в периоде</h3>
                  <button onClick={() => handleOpenNewReportModal(period.id)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>Добавить отчёт</span>
                  </button>
              </div>
              {reportsByPeriod.has(period.id) && reportsByPeriod.get(period.id)!.length > 0 ? (
                  <ul className="space-y-3">
                  {reportsByPeriod.get(period.id)!.map(report => (
                      <li key={report.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                          <p className="font-semibold text-gray-800">{report.name}</p>
                          <p className="text-sm text-gray-600">{report.themeDisplay}</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                          <IconButton icon={Edit} aria-label="Редактировать тип отчета" onClick={() => handleOpenEditReportModal(report)} className="text-gray-500 hover:bg-gray-200 hover:text-gray-900" />
                          <IconButton icon={Trash2} aria-label="Удалить тип отчета" onClick={() => handleOpenDeleteModal(report.id)} className="text-red-500 hover:bg-red-200 hover:text-red-700" />
                      </div>
                      </li>
                  ))}
                  </ul>
              ) : (
                  <div className="text-center py-6 text-gray-500">
                      <p>Для этого периода еще не добавлены типы отчётов.</p>
                  </div>
              )}
            </div>
          </div>
        )) : (
          <div className="text-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-medium text-gray-800">Отчётные периоды не найдены</h2>
              <p className="mt-2 text-gray-500">Начните работу с создания нового отчётного периода.</p>
          </div>
        )}
      </div>

      {isPeriodModalOpen && (
        <ReportPeriodModal
          isOpen={isPeriodModalOpen}
          onClose={() => setIsPeriodModalOpen(false)}
          onSuccess={handlePeriodSuccess}
          period={editingPeriod}
        />
      )}

      {isReportModalOpen && currentPeriodForReport && (
        <ReportTypeModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSuccess={handleReportSuccess}
          report={editingReport}
          periodId={currentPeriodForReport}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Подтвердите удаление"
        confirmButtonVariant="danger"
        confirmButtonText="Удалить"
      >
        Вы уверены, что хотите удалить этот тип отчёта? Это действие необратимо.
      </ConfirmationModal>
    </>
  );
};

export default AdminReportsView;