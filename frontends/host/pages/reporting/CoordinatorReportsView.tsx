import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { ReportPeriod, Report, User as UserType } from '../../types';
import { 
  Users, AlertCircle, ChevronDown, ChevronUp, Calendar, Inbox, Loader2, Eye
} from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import CoordinatorReportsSkeleton from '../../components/skeletons/CoordinatorReportsSkeleton';
import { format, isAfter, parseISO, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import CheckboxDropdown from '../../components/ui/CheckboxDropdown';
import Select from '../../components/ui/Select';
import type { DateRange } from 'react-day-picker';

const THEME_ORDER: Record<string, number> = {
    'infoudar': 1,
    'vdpg': 2,
    'event': 3,
    'reg_event': 4,
    'opt_event': 5
};

const CoordinatorReportsView: React.FC = () => {
    const { user } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    
    const [periods, setPeriods] = useState<ReportPeriod[]>([]);
    const [expandedPeriods, setExpandedPeriods] = useState<Set<number>>(new Set());
    const [initialLoading, setInitialLoading] = useState(true);
    const [coordinatorProfile, setCoordinatorProfile] = useState<UserType | null>(null);

    const [allSlotTypes, setAllSlotTypes] = useState<string[]>([]);
    const [selectedSlotTypes, setSelectedSlotTypes] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState<string>('newest');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const [isSlotTypesInitialized, setIsSlotTypesInitialized] = useState(false);
    const [navigatingPeriodId, setNavigatingPeriodId] = useState<number | null>(null);

    const initPage = useCallback(async () => {
        try {
            setInitialLoading(true);
            const [p, profile, viewData] = await Promise.all([
                api.getReportPeriods(),
                user?.user_id ? api.getUserById(user.user_id) : Promise.resolve(null),
                api.getAdminViewData() // Fetching this to get all reports for filtering
            ]);
            
            if (profile) {
                setCoordinatorProfile(profile);
            }

            const types = Array.from(new Set(viewData.reports.map(r => r.themeDisplay)));
            setAllSlotTypes(types);
            if (!isSlotTypesInitialized) {
                setSelectedSlotTypes(types);
                setIsSlotTypesInitialized(true);
            }

            // We use viewData.periods and populate the `reports` array manually
            const sortedPeriods = viewData.periods.map(item => {
                const pReports = viewData.reports.filter(r => r.reportPeriod === item.id);
                pReports.sort((a, b) => (THEME_ORDER[a.theme] || 99) - (THEME_ORDER[b.theme] || 99));
                return {
                    ...item,
                    reports: pReports,
                    name: item.name || format(parseISO(item.startDate), 'LLLL yyyy', { locale: ru })
                };
            }).sort((a, b) => parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime());
            
            setPeriods(sortedPeriods);
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось загрузить данные отчетности.');
        } finally {
            setInitialLoading(false);
        }
    }, [user, showAlert, isSlotTypesInitialized]);

    useEffect(() => {
        initPage();
    }, [initPage]);

    const filteredData = useMemo(() => {
        let periodsWithReports = periods.map(p => ({ ...p }));

        // 1. Date filter
        if (dateRange?.from) {
            periodsWithReports = periodsWithReports.filter(p => {
                const pStart = parseISO(p.startDate);
                const pEnd = parseISO(p.endDate);
                
                if (dateRange.to) {
                    return (pStart <= dateRange.to && pEnd >= dateRange.from!);
                }
                return pEnd >= dateRange.from!;
            });
        }

        // 2. Slot Type filter
        periodsWithReports = periodsWithReports.map(p => {
            const pReports = (p.reports || []).filter(r => selectedSlotTypes.includes(r.themeDisplay));
            pReports.sort((a, b) => (THEME_ORDER[a.theme] || 99) - (THEME_ORDER[b.theme] || 99));
            return { ...p, reports: pReports };
        });

        // Hide periods with 0 reports if a slot filter is applied
        const allTypesSelected = selectedSlotTypes.length === allSlotTypes.length;
        if (!allTypesSelected) {
            periodsWithReports = periodsWithReports.filter(p => p.reports && p.reports.length > 0);
        }

        // 3. Sort
        periodsWithReports.sort((a, b) => {
            if (sortOrder === 'newest') {
                return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            }
            if (sortOrder === 'oldest') {
                return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            }
            if (sortOrder === 'most_slots') {
                return (b.reports?.length || 0) - (a.reports?.length || 0);
            }
            if (sortOrder === 'least_slots') {
                return (a.reports?.length || 0) - (b.reports?.length || 0);
            }
            return 0;
        });

        return periodsWithReports;
    }, [periods, dateRange, selectedSlotTypes, sortOrder, allSlotTypes.length]);

    const slotTypeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allSlotTypes.forEach(type => counts[type] = 0);
        
        periods.forEach(p => {
            p.reports?.forEach(r => {
                if (counts[r.themeDisplay] !== undefined) {
                    counts[r.themeDisplay]++;
                }
            });
        });
        return counts;
    }, [periods, allSlotTypes]);

    const sortOptions = [
        { value: 'newest', label: 'Сначала новые' },
        { value: 'oldest', label: 'Сначала старые' },
        { value: 'most_slots', label: 'Больше отчетов' },
        { value: 'least_slots', label: 'Меньше отчетов' }
    ];

    const handleViewRegion = async (periodId: number) => {
        if (navigatingPeriodId) return;
        setNavigatingPeriodId(periodId);
        try {
            const periodDetail = await api.getReportPeriodById(periodId);
            const myRegionName = (coordinatorProfile?.deputyForm?.region || '').trim();
            const myRegionEntry = periodDetail.regionReports?.find(rr => 
                rr.regionName.trim().toLowerCase() === myRegionName.toLowerCase()
            );
            
            if (myRegionEntry) {
                navigate(`monitoring/${myRegionEntry.id}`);
            } else {
                showAlert('error', 'Ошибка', 'Регион не найден в этом периоде.');
            }
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось загрузить данные региона.');
        } finally {
            setNavigatingPeriodId(null);
        }
    };

    const togglePeriod = (id: number) => {
        const newSet = new Set(expandedPeriods);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedPeriods(newSet);
    };

    if (initialLoading) return <CoordinatorReportsSkeleton />;

    return (
        <div className="max-w-full space-y-4 animate-in fade-in duration-500 pt-4 sm:pt-0 pb-8 sm:pb-0">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-4 sm:px-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {user?.role === 'deputy' ? 'Моя отчётность' : 'Светофор'}
                    </h1>
                    {user?.role !== 'deputy' && (
                        <div className="flex items-center justify-center bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {filteredData.length}
                        </div>
                    )}
                </div>
            </header>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
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

            <div className="space-y-4">
                {filteredData.length > 0 ? (
                    <div className="bg-white sm:rounded-xl sm:border border-gray-200 overflow-hidden">
                        {filteredData.map((period, index) => {
                            const isExpanded = expandedPeriods.has(period.id);

                            return (
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
                                                    onClick={() => handleViewRegion(period.id)}
                                                    disabled={navigatingPeriodId === period.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                >
                                                    {navigatingPeriodId === period.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} <span>Посмотреть</span>
                                                </button>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); togglePeriod(period.id); }}
                                                className={`p-2 rounded-full hover:bg-gray-100 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            >
                                                <ChevronDown className="text-gray-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/30 animate-in slide-in-from-top-2 duration-200">
                                            {/* Mobile Action Buttons */}
                                            <div className="sm:hidden flex gap-2 mb-4">
                                                <button 
                                                    onClick={() => handleViewRegion(period.id)}
                                                    disabled={navigatingPeriodId === period.id}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold disabled:opacity-50"
                                                >
                                                    {navigatingPeriodId === period.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} Посмотреть
                                                </button>
                                            </div>
                                            
                                            <div className="sm:hidden h-px bg-gray-200 mb-4 -mx-4"></div>

                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-gray-700">Отчеты ({period.reports?.length || 0})</h3>
                                            </div>
                                            
                                            {period.reports && period.reports.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {period.reports.map(report => (
                                                        <li 
                                                            key={report.id} 
                                                            className="p-3 sm:p-4 bg-slate-50 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center hover:border-blue-200 transition-colors gap-3 sm:gap-0 cursor-default"
                                                        >
                                                            <div className="flex-1 min-w-0 pr-4 flex flex-col gap-1">
                                                                <span className="text-xs text-gray-500 font-medium normal-case">
                                                                    {report.themeDisplay}
                                                                </span>
                                                                <span className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{report.name}</span>
                                                                {report.description && <p className="text-sm text-gray-500 line-clamp-2 mt-1">{report.description}</p>}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-gray-200">
                                                    <p className="text-gray-500 text-sm">В этом периоде пока нет созданных отчетов</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-12 text-center bg-white rounded-xl border border-gray-200">
                        <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Ничего не найдено</h3>
                        <p className="text-gray-500">Попробуйте изменить параметры фильтрации</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoordinatorReportsView;