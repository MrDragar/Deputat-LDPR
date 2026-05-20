import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { ReportPeriod, Report, ReportTheme, AdminViewData } from '../../types';
import { Plus, Edit, Trash2, Calendar, Loader2, Map, ChevronDown } from 'lucide-react';
import IconButton from '../../components/ui/IconButton';
import ReportPeriodModal from './modals/ReportPeriodModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import ReportTypeModal from './modals/ReportTypeModal';
import MobileSlotDetailView from './MobileSlotDetailView';
import { useAlert } from '../../context/AlertContext';
import AdminReportsSkeleton from '../../components/skeletons/AdminReportsSkeleton';
import { format, parseISO, isSameMonth } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import CheckboxDropdown from '../../components/ui/CheckboxDropdown';
import Select from '../../components/ui/Select';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { DateRange } from '../../components/ui/Calendar';

const THEME_ORDER: Record<ReportTheme, number> = {
    'infoudar': 1,
    'event': 2,
    'reg_event': 2,
    'opt_event': 2,
    'vdpg': 3,
    'letter': 4
};

const sortOptions = [
    { value: 'newest', label: 'Сначала новые' },
    { value: 'oldest', label: 'Сначала старые' },
    { value: 'most_slots', label: 'Больше всего отчетов' },
    { value: 'least_slots', label: 'Меньше всего отчетов' }
];

const AdminReportsView: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AdminViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  // Modals state
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReportPeriod | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [currentPeriodForReport, setCurrentPeriodForReport] = useState<ReportPeriod | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isFabVisible, setIsFabVisible] = useState(true);
  
  // Mobile Slot Detail State
  const [mobileSlotDetail, setMobileSlotDetail] = useState<{ report: Report | null, period: ReportPeriod } | null>(null);

  // Accordion state
  const [expandedPeriods, setExpandedPeriods] = useState<number[]>([]);

  // Filters state
  const [selectedSlotTypes, setSelectedSlotTypes] = useState<string[]>(() => {
      const saved = sessionStorage.getItem('adminReports_slotTypes');
      return saved ? JSON.parse(saved) : [];
  });
  const [isSlotTypesInitialized, setIsSlotTypesInitialized] = useState(() => {
      return !!sessionStorage.getItem('adminReports_slotTypes');
  });
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const viewData = await api.getAdminViewData();
      setData(viewData);
      
      if (!isSlotTypesInitialized) {
          const types = Array.from(new Set(viewData.reports.map(r => r.themeDisplay)));
          setSelectedSlotTypes(types);
          setIsSlotTypesInitialized(true);
      }
    } catch (error) {
      showAlert('error', 'Ошибка', 'Не удалось загрузить данные.');
    } finally {
      setLoading(false);
    }
  }, [showAlert, isSlotTypesInitialized]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const mainContentArea = document.querySelector('main');
    if (!mainContentArea) return;

    const handleScroll = () => {
        if (mainContentArea.scrollTop > 50) {
            setIsFabVisible(false);
        } else {
            setIsFabVisible(true);
        }
    };

    mainContentArea.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainContentArea.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
      if (isSlotTypesInitialized) {
          sessionStorage.setItem('adminReports_slotTypes', JSON.stringify(selectedSlotTypes));
      }
  }, [selectedSlotTypes, isSlotTypesInitialized]);

  const slotTypeCounts = useMemo(() => {
      if (!data) return {};
      const counts: Record<string, number> = {};
      data.reports.forEach(r => {
          counts[r.themeDisplay] = (counts[r.themeDisplay] || 0) + 1;
      });
      return counts;
  }, [data]);

  const allSlotTypes = useMemo(() => {
      if (!data) return [];
      return Array.from(new Set(data.reports.map(r => r.themeDisplay)));
  }, [data]);

  const filteredData = useMemo(() => {
      if (!data) return [];

      let filteredPeriods = [...data.periods];

      // 1. Filter by Date Range
      if (dateRange?.from) {
          filteredPeriods = filteredPeriods.filter(p => {
              const pStart = new Date(p.startDate);
              const pEnd = new Date(p.endDate);
              if (dateRange.to) {
                  return pStart <= dateRange.to && pEnd >= dateRange.from;
              }
              return pStart >= dateRange.from || pEnd >= dateRange.from;
          });
      }

      // 2. Filter Reports by Slot Type
      const filteredReports = data.reports.filter(r => selectedSlotTypes.includes(r.themeDisplay));

      // 3. Map reports to periods
      let periodsWithReports = filteredPeriods.map(p => {
          const pReports = filteredReports.filter(r => r.reportPeriod === p.id);
          pReports.sort((a, b) => (THEME_ORDER[a.theme] || 99) - (THEME_ORDER[b.theme] || 99));
          return { ...p, reports: pReports };
      });

      // Hide periods with 0 reports if a slot filter is applied
      const allTypesSelected = data.reports.length === 0 || selectedSlotTypes.length === allSlotTypes.length;
      if (!allTypesSelected) {
          periodsWithReports = periodsWithReports.filter(p => p.reports.length > 0);
      }

      // 4. Sort
      periodsWithReports.sort((a, b) => {
          if (sortOrder === 'newest') {
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          }
          if (sortOrder === 'oldest') {
              return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          }
          if (sortOrder === 'most_slots') {
              return b.reports.length - a.reports.length;
          }
          if (sortOrder === 'least_slots') {
              return a.reports.length - b.reports.length;
          }
          return 0;
      });

      return periodsWithReports;
  }, [data, dateRange, selectedSlotTypes, sortOrder, allSlotTypes.length]);

  const togglePeriod = (id: number) => {
      setExpandedPeriods(prev => 
          prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
  };

  const handlePeriodSuccess = () => {
      setIsPeriodModalOpen(false);
      fetchData();
  };
  
  const handleReportSuccess = () => {
      setIsReportModalOpen(false);
      fetchData();
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.deleteReport(itemToDelete);
      showAlert('success', 'Успешно', 'Слот удален.');
      fetchData();
      setMobileSlotDetail(null);
    } catch {
       showAlert('error', 'Ошибка', 'Не удалось удалить.');
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  if (loading && !data) return <AdminReportsSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pt-4 sm:pt-0 pb-8 sm:pb-0">
        {/* Header & Filters Section */}
        <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Светофор</h1>
                    <span className="bg-blue-600 text-white font-semibold px-3 py-1 text-sm rounded-full">
                        {filteredData.length}
                    </span>
                </div>
                <button
                    onClick={() => { setEditingPeriod(null); setIsPeriodModalOpen(true); }}
                    className="hidden sm:inline-flex items-center justify-center bg-blue-600 text-white font-semibold rounded-full w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 sm:rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline sm:ml-2">Новый период</span>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <CheckboxDropdown
                    title="Типы отчетов"
                    options={allSlotTypes}
                    selectedOptions={selectedSlotTypes}
                    onChange={setSelectedSlotTypes}
                    counts={slotTypeCounts}
                    searchable={false}
                    labelClassName="hidden sm:block"
                />
                
                <div>
                    <label className="hidden sm:block text-base font-semibold text-gray-800 mb-2">Сортировка</label>
                    <Select
                        name="sortOrder"
                        options={sortOptions}
                        value={sortOrder}
                        onChange={(_, value) => setSortOrder(value)}
                    />
                </div>

                <div>
                    <label className="hidden sm:block text-base font-semibold text-gray-800 mb-2">Период</label>
                    <DateRangePicker
                        date={dateRange}
                        onDateChange={setDateRange}
                    />
                </div>
            </div>
        </div>

        {/* Periods List */}
        <div className="space-y-4">
            {filteredData.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {filteredData.map((period, index) => (
                    <div key={period.id} className={`${index !== 0 ? 'border-t border-gray-200' : ''}`}>
                        <div 
                            className="p-4 sm:p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => togglePeriod(period.id)}
                        >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base shadow-sm">
                            {index + 1}
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center py-1">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <h2 className="text-sm sm:text-base font-bold text-gray-800 capitalize truncate">{period.name}</h2>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                                {format(parseISO(period.startDate), 'dd.MM.yyyy')} — {format(parseISO(period.endDate), 'dd.MM.yyyy')}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-2">
                        <div className="flex items-center justify-center bg-gray-100 text-gray-600 w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold">
                            {period.reports?.length || 0}
                        </div>
                        <div className="hidden sm:flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={() => navigate(`regions/${period.id}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
                            >
                                <Map size={16} /> <span>Регионы</span>
                            </button>
                            <IconButton icon={Edit} onClick={() => { setEditingPeriod(period); setIsPeriodModalOpen(true); }} className="text-gray-400 hover:text-blue-600 bg-white border border-gray-200" title="Редактировать даты периода" />
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); togglePeriod(period.id); }}
                            className={`p-2 rounded-full hover:bg-gray-100 transform transition-transform duration-200 ${expandedPeriods.includes(period.id) ? 'rotate-180' : ''}`}
                        >
                            <ChevronDown className="text-gray-500" />
                        </button>
                    </div>
                </div>
                
                {expandedPeriods.includes(period.id) && (
                    <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/30 animate-in slide-in-from-top-2 duration-200">
                        {/* Mobile Action Buttons */}
                        <div className="sm:hidden flex gap-2 mb-4">
                            <button 
                                onClick={() => navigate(`regions/${period.id}`)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold"
                            >
                                <Map size={16} /> Регионы
                            </button>
                            <button 
                                onClick={() => { setEditingPeriod(period); setIsPeriodModalOpen(true); }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-bold"
                            >
                                <Edit size={16} /> Изменить
                            </button>
                        </div>
                        
                        <div className="sm:hidden h-px bg-gray-200 mb-4 -mx-4"></div>

                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700">Отчеты ({period.reports?.length || 0})</h3>
                            <button onClick={() => { 
                                if (window.innerWidth < 640) {
                                    setMobileSlotDetail({ report: null, period: period });
                                } else {
                                    setEditingReport(null); 
                                    setCurrentPeriodForReport(period); 
                                    setIsReportModalOpen(true); 
                                }
                            }} className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1">
                                <Plus size={16} /> Добавить отчет
                            </button>
                        </div>
                        
                        {period.reports && period.reports.length > 0 ? (
                            <ul className="space-y-2">
                                {period.reports.map(report => (
                                    <li 
                                        key={report.id} 
                                        className="p-3 sm:p-4 bg-slate-50 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center hover:border-blue-200 transition-colors gap-3 sm:gap-0 cursor-pointer sm:cursor-default"
                                        onClick={() => {
                                            if (window.innerWidth < 640) {
                                                setMobileSlotDetail({ report, period: period });
                                            }
                                        }}
                                    >
                                        <div className="flex-1 min-w-0 pr-4 flex flex-col gap-1">
                                            <span className="text-xs text-gray-500 font-medium normal-case">
                                                {report.themeDisplay}
                                            </span>
                                            <span className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{report.name}</span>
                                            {report.description && <p className="text-sm text-gray-500 line-clamp-2 mt-1">{report.description}</p>}
                                        </div>
                                        <div className="hidden sm:flex gap-2 self-end sm:self-auto">
                                            <IconButton icon={Edit} onClick={(e) => { e.stopPropagation(); setEditingReport(report); setCurrentPeriodForReport(period); setIsReportModalOpen(true); }} className="h-9 w-9 text-gray-500 hover:text-blue-600 bg-white border border-gray-200" />
                                            <IconButton icon={Trash2} onClick={(e) => { e.stopPropagation(); setItemToDelete(report.id); setIsDeleteModalOpen(true); }} className="h-9 w-9 text-gray-500 hover:text-red-600 bg-white border border-gray-200" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 text-sm">В этом периоде пока нет созданных отчетов</p>
                                <button onClick={() => { 
                                    if (window.innerWidth < 640) {
                                        setMobileSlotDetail({ report: null, period: period });
                                    } else {
                                        setEditingReport(null); 
                                        setCurrentPeriodForReport(period); 
                                        setIsReportModalOpen(true); 
                                    }
                                }} className="mt-2 text-sm text-blue-600 font-medium hover:underline">
                                    Создать первый отчет
                                </button>
                            </div>
                        )}
                    </div>
                )}
                    </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-lg">Ничего не найдено по заданным фильтрам</p>
                    <button 
                        onClick={() => {
                            setSelectedSlotTypes(allSlotTypes);
                            setSortOrder('newest');
                            setDateRange(undefined);
                        }}
                        className="mt-4 text-blue-600 font-medium hover:underline"
                    >
                        Сбросить фильтры
                    </button>
                </div>
            )}
        </div>
        
        {isPeriodModalOpen && (
            <ReportPeriodModal isOpen={isPeriodModalOpen} onClose={() => setIsPeriodModalOpen(false)} onSuccess={handlePeriodSuccess} period={editingPeriod} />
        )}
        {isReportModalOpen && currentPeriodForReport && (
            <ReportTypeModal 
                isOpen={isReportModalOpen} 
                onClose={() => setIsReportModalOpen(false)} 
                onSuccess={handleReportSuccess} 
                onDelete={(id) => {
                    setIsReportModalOpen(false);
                    setItemToDelete(id);
                    setIsDeleteModalOpen(true);
                }}
                report={editingReport} 
                period={currentPeriodForReport} 
            />
        )}
        
        {mobileSlotDetail && (
            <MobileSlotDetailView
                report={mobileSlotDetail.report}
                period={mobileSlotDetail.period}
                onClose={() => setMobileSlotDetail(null)}
                onSuccess={() => {
                    setMobileSlotDetail(null);
                    fetchData();
                }}
                onDelete={(id) => {
                    setItemToDelete(id);
                    setIsDeleteModalOpen(true);
                }}
            />
        )}

        <ConfirmationModal 
            isOpen={isDeleteModalOpen} 
            onClose={() => setIsDeleteModalOpen(false)} 
            onConfirm={handleDelete} 
            title="Удалить слот?" 
            confirmButtonVariant="danger"
            confirmButtonText="Удалить"
        >
            Вы уверены? Это действие нельзя отменить.
        </ConfirmationModal>

        {/* Mobile FAB */}
        <button
            onClick={() => { setEditingPeriod(null); setIsPeriodModalOpen(true); }}
            className={`sm:hidden fixed bottom-6 right-6 z-30 flex items-center justify-center h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-300 ease-in-out hover:scale-105 ${isFabVisible ? 'translate-y-0' : 'translate-y-24'}`}
            aria-label="Новый период"
        >
            <Plus className="h-7 w-7" />
        </button>
    </div>
  );
};

export default AdminReportsView;
