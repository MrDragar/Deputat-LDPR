import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, Eye, Calendar as CalendarIcon, Download, ChevronRight, FileArchive, FileSpreadsheet, FileText, Loader2, X, FileCheck, FileX } from 'lucide-react';
import { getUsers, getAllReports } from '../api';
import { User, Report } from '../types';
import Layout from '../components/Layout';
import Select from '../components/ui/Select';
import CheckboxDropdown from '../components/ui/CheckboxDropdown';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { DateRange } from '../components/ui/Calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Skeleton from '../components/ui/Skeleton';
import Alert from '../components/ui/Alert';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { exportToZip, exportToExcel, exportToDocx } from '../utils/exportUtils';
import { REGIONS } from '../constants';

interface DeputyData {
  user: User;
  latestReport: Report | null;
}

let cachedState: {
  users: User[] | null;
  reports: Report[] | null;
  searchQuery: string;
  selectedRegions: string[];
  selectedLevels: string[];
  selectedReportAvailability: string[];
  dateRange: DateRange | undefined;
  sortBy: string;
  expandedRegions: string[];
} | null = null;

const LEVEL_FILTERS = [
  { id: 'СФ', label: 'СФ', values: ['Совет Федерации Федерального собрания Российской Федерации', 'СФ'] },
  { id: 'ГД', label: 'ГД', values: ['Государственная дума Федерального собрания Российской Федерации', 'ГД'] },
  { id: 'ЗС', label: 'ЗС', values: ['Законодательное собрание', 'ЗС'] },
  { id: 'АЦС', label: 'АЦС', values: ['АЦС'] },
  { id: 'МСУ', label: 'МСУ', values: ['МСУ'] },
];

const getAbbreviatedLevel = (level: string) => {
  if (level === 'Государственная дума Федерального собрания Российской Федерации') return 'ГД';
  if (level === 'Совет Федерации Федерального собрания Российской Федерации') return 'СФ';
  if (level === 'Законодательное собрание') return 'ЗС';
  return level;
};

const DeputyReportsPage: React.FC<{ showSidebar?: boolean }> = ({ showSidebar = false }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(cachedState?.users || []);
  const [reports, setReports] = useState<Report[]>(cachedState?.reports || []);
  const [isLoading, setIsLoading] = useState(!cachedState?.users);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(cachedState?.searchQuery || '');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(cachedState?.selectedRegions || []);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(cachedState?.selectedLevels || LEVEL_FILTERS.map(f => f.id));
  const [selectedReportAvailability, setSelectedReportAvailability] = useState<string[]>(cachedState?.selectedReportAvailability || ['Да', 'Нет']);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(cachedState?.dateRange);
  const [sortBy, setSortBy] = useState(cachedState?.sortBy || 'newest');
  
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set(cachedState?.expandedRegions || [])
  );
  
  const [showFab, setShowFab] = useState(true);
  const lastScrollY = useRef(0);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMobileExportOpen, setIsMobileExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const exportDesktopRef = useRef<HTMLDivElement>(null);
  const exportMobileRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDesktop = !exportDesktopRef.current || !exportDesktopRef.current.contains(event.target as Node);
      const isOutsideMobile = !exportMobileRef.current || !exportMobileRef.current.contains(event.target as Node);
      if (isOutsideDesktop && isOutsideMobile) {
        setIsExportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExport = async (type: 'zip' | 'excel' | 'docx') => {
    setIsExportOpen(false);
    setIsMobileExportOpen(false);
    if (type === 'zip') {
      setIsExporting(true);
      setExportProgress({ current: 0, total: 0 });
    }
    setExportSuccess(false);
    try {
      if (type === 'zip') {
        await exportToZip(groupedByRegion, (current, total) => {
          setExportProgress({ current, total });
        });
      } else if (type === 'excel') {
        await exportToExcel(groupedByRegion);
      } else if (type === 'docx') {
        await exportToDocx(groupedByRegion);
      }
      setExportSuccess(true);
    } catch (err) {
      console.error('Export failed', err);
      setError('Ошибка при экспорте файлов');
    } finally {
      if (type === 'zip') {
        setIsExporting(false);
        setExportProgress({ current: 0, total: 0 });
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 50) {
        setShowFab(true);
      } else {
        setShowFab(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    cachedState = {
      users,
      reports,
      searchQuery,
      selectedRegions,
      selectedLevels,
      selectedReportAvailability,
      dateRange,
      sortBy,
      expandedRegions: Array.from(expandedRegions)
    };
  }, [users, reports, searchQuery, selectedRegions, selectedLevels, selectedReportAvailability, dateRange, sortBy, expandedRegions]);

  useEffect(() => {
    const fetchData = async () => {
      if (!cachedState?.users) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const [usersData, reportsData] = await Promise.all([
          getUsers(),
          getAllReports()
        ]);
        
        const usersChanged = JSON.stringify(usersData) !== JSON.stringify(users);
        const reportsChanged = JSON.stringify(reportsData) !== JSON.stringify(reports);
        
        if (usersChanged) setUsers(usersData);
        if (reportsChanged) setReports(reportsData);
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить данные');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allRegions = useMemo(() => {
    const regions = new Set<string>(REGIONS);
    users.forEach(u => {
      if (u.deputyForm?.region) regions.add(u.deputyForm.region);
    });
    return Array.from(regions).sort();
  }, [users]);

  const deputyData: DeputyData[] = useMemo(() => {
    return users.map(user => {
      const userReports = reports.filter(r => r.user_id === user.userId);
      userReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return {
        user,
        latestReport: userReports.length > 0 ? userReports[0] : null
      };
    });
  }, [users, reports]);

  const regionCounts = useMemo(() => {
    let result = deputyData;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(data => {
        const form = data.user.deputyForm;
        const fullName = form ? `${form.lastName} ${form.firstName} ${form.middleName || ''}`.toLowerCase() : data.user.login.toLowerCase();
        return fullName.includes(query);
      });
    }

    if (selectedLevels.length === 0) {
      result = [];
    } else {
      result = result.filter(data => {
        const level = data.user.deputyForm?.representativeBodyLevel;
        if (!level) return false;
        
        return selectedLevels.some(selectedId => {
          const filter = LEVEL_FILTERS.find(f => f.id === selectedId);
          return filter ? filter.values.includes(level) : false;
        });
      });
    }

    if (selectedReportAvailability.length === 0) {
      result = [];
    } else if (selectedReportAvailability.length === 1) {
      const showWithReport = selectedReportAvailability.includes('Да');
      result = result.filter(data => {
        const hasReport = !!data.latestReport;
        return hasReport === showWithReport;
      });
    }

    if (dateRange?.from) {
      result = result.filter(data => {
        if (!data.latestReport) return false;
        const reportDate = new Date(data.latestReport.created_at);
        reportDate.setHours(0, 0, 0, 0);
        
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return reportDate.getTime() >= fromDate.getTime() && reportDate.getTime() <= toDate.getTime();
        } else {
          return reportDate.getTime() === fromDate.getTime();
        }
      });
    }

    const counts: Record<string, number> = {};
    REGIONS.forEach(r => counts[r] = 0);

    result.forEach(data => {
      const region = data.user.deputyForm?.region;
      if (region && counts[region] !== undefined) {
        counts[region]++;
      } else if (region) {
        counts[region] = (counts[region] || 0) + 1;
      }
    });

    return counts;
  }, [deputyData, searchQuery, selectedLevels, selectedReportAvailability, dateRange]);

  const filteredAndSortedDeputies = useMemo(() => {
    let result = deputyData;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(data => {
        const form = data.user.deputyForm;
        const fullName = form ? `${form.lastName} ${form.firstName} ${form.middleName || ''}`.toLowerCase() : data.user.login.toLowerCase();
        return fullName.includes(query);
      });
    }

    if (selectedRegions.length > 0) {
      result = result.filter(data => data.user.deputyForm?.region && selectedRegions.includes(data.user.deputyForm.region));
    }

    if (selectedLevels.length === 0) {
      return [];
    }

    result = result.filter(data => {
      const level = data.user.deputyForm?.representativeBodyLevel;
      if (!level) return false;
      
      return selectedLevels.some(selectedId => {
        const filter = LEVEL_FILTERS.find(f => f.id === selectedId);
        return filter ? filter.values.includes(level) : false;
      });
    });

    if (selectedReportAvailability.length === 0) {
      return [];
    } else if (selectedReportAvailability.length === 1) {
      const showWithReport = selectedReportAvailability.includes('Да');
      result = result.filter(data => {
        const hasReport = !!data.latestReport;
        return hasReport === showWithReport;
      });
    }

    if (dateRange?.from) {
      result = result.filter(data => {
        if (!data.latestReport) return false;
        const reportDate = new Date(data.latestReport.created_at);
        reportDate.setHours(0, 0, 0, 0);
        
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return reportDate.getTime() >= fromDate.getTime() && reportDate.getTime() <= toDate.getTime();
        } else {
          return reportDate.getTime() === fromDate.getTime();
        }
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'oldest') {
        const timeA = a.latestReport ? new Date(a.latestReport.created_at).getTime() : 0;
        const timeB = b.latestReport ? new Date(b.latestReport.created_at).getTime() : 0;
        return timeA - timeB;
      }
      // Default to newest for 'newest', 'reports_desc', 'reports_asc'
      const timeA = a.latestReport ? new Date(a.latestReport.created_at).getTime() : 0;
      const timeB = b.latestReport ? new Date(b.latestReport.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return result;
  }, [deputyData, searchQuery, selectedRegions, selectedLevels, selectedReportAvailability, dateRange, sortBy]);

  const groupedByRegion = useMemo(() => {
    const groups: Record<string, DeputyData[]> = {};
    filteredAndSortedDeputies.forEach(deputy => {
      const region = deputy.user.deputyForm?.region || 'Регион не указан';
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(deputy);
    });
    
    const regionsArray = Object.keys(groups).map(region => {
      const deputies = groups[region];
      const submittedCount = deputies.filter(d => d.latestReport).length;
      return {
        region,
        deputies,
        submittedCount
      };
    });

    regionsArray.sort((a, b) => {
      if (sortBy === 'reports_desc') {
        return b.submittedCount - a.submittedCount || a.region.localeCompare(b.region);
      }
      if (sortBy === 'reports_asc') {
        return a.submittedCount - b.submittedCount || a.region.localeCompare(b.region);
      }
      return a.region.localeCompare(b.region);
    });

    return regionsArray.map(({ region, deputies }) => ({
      region,
      deputies
    }));
  }, [filteredAndSortedDeputies, sortBy]);

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  };

  const toggleLevelFilter = (levelId: string) => {
    setSelectedLevels(prev => 
      prev.includes(levelId) 
        ? prev.filter(id => id !== levelId)
        : [...prev, levelId]
    );
  };

  return (
    <Layout showSidebar={showSidebar}>
      {error && (
        <Alert
          type="error"
          title="Ошибка"
          message={error}
          onClose={() => setError(null)}
          className="mb-6"
        />
      )}

      {isExporting && (
        <Alert
          type="info"
          title="Экспорт файлов"
          message={
            exportProgress.total > 0
              ? `Скачивание файлов: ${exportProgress.current} из ${exportProgress.total}... Пожалуйста, подождите.`
              : 'Подготовка файлов к экспорту... Пожалуйста, подождите.'
          }
          className="mb-6"
          duration={0}
        />
      )}

      {exportSuccess && (
        <Alert
          type="success"
          title="Успешно"
          message="Файлы успешно экспортированы."
          onClose={() => setExportSuccess(false)}
          className="mb-6"
        />
      )}

      <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200 mb-4 md:mb-6">
        {isLoading ? (
          <>
            <div className="mb-6 hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Skeleton className="h-[42px] w-full rounded-lg" />
              <Skeleton className="h-[42px] w-full rounded-lg" />
              <Skeleton className="h-[42px] w-full rounded-lg" />
              <Skeleton className="h-[42px] w-full rounded-lg" />
            </div>

            <div>
              <Skeleton className="h-5 w-48 mb-3" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-16 rounded-full" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Отчеты депутатов</h1>
                <span className="bg-blue-600 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {filteredAndSortedDeputies.length}
                </span>
              </div>
              <div className="relative hidden md:block" ref={exportDesktopRef}>
                <button 
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  disabled={isExporting}
                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                  {isExporting ? 'Экспорт...' : 'Экспортировать'}
                </button>
                {isExportOpen && !isExporting && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="py-1">
                      <button
                        onClick={() => handleExport('zip')}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <FileArchive className="h-4 w-4 text-purple-600" />
                        В формате ZIP
                      </button>
                      <button
                        onClick={() => handleExport('excel')}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        В формате Excel
                      </button>
                      <button
                        onClick={() => handleExport('docx')}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        В формате Docx
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="lg:col-span-1">
                <div className="relative h-[42px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск по ФИО..."
                    className="w-full h-full pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>
              <div className="lg:col-span-1">
                <CheckboxDropdown
                  options={allRegions}
                  selectedOptions={selectedRegions}
                  onChange={setSelectedRegions}
                  counts={regionCounts}
                  title=""
                  placeholder="Регион"
                  className="w-full"
                />
              </div>
              <div className="lg:col-span-1">
                <Select
                  name="sort"
                  value={sortBy}
                  onChange={(_, value) => setSortBy(value)}
                  options={[
                    { value: 'newest', label: 'Сначала новые' },
                    { value: 'oldest', label: 'Сначала старые' },
                    { value: 'reports_desc', label: 'Больше отчетов' },
                    { value: 'reports_asc', label: 'Меньше отчетов' },
                  ]}
                />
              </div>
              <div className="lg:col-span-1 relative" id="reports-view-root">
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-stretch">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Уровень представительства</h3>
                <div className="flex flex-wrap gap-2">
                  {LEVEL_FILTERS.map(filter => {
                    const isSelected = selectedLevels.includes(filter.id);
                    return (
                      <button
                        key={filter.id}
                        onClick={() => toggleLevelFilter(filter.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Только десктопная линия */}
              <div className="hidden md:block w-[0.5px] bg-gray-200 my-2"></div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Наличие отчета</h3>
                <div className="flex flex-wrap gap-2">
                  {['Да', 'Нет'].map(option => {
                    const isSelected = selectedReportAvailability.includes(option);
                    return (
                      <button
                        key={option}
                        onClick={() => {
                          setSelectedReportAvailability(prev =>
                            prev.includes(option)
                              ? prev.filter(item => item !== option)
                              : [...prev, option]
                          );
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-white sm:rounded-xl sm:border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {/* Header skeleton */}
            <div className="hidden lg:flex items-center gap-3 py-4 px-4 border-b border-gray-200 bg-gray-50">
               <Skeleton className="h-4 w-6" />
               <div className="flex-1 grid grid-cols-12 gap-4">
                 <Skeleton className="col-span-4 h-4" />
                 <Skeleton className="col-span-3 h-4" />
                 <Skeleton className="col-span-2 h-4" />
                 <Skeleton className="col-span-2 h-4" />
                 <Skeleton className="col-span-1 h-4" />
               </div>
            </div>
            {/* Rows skeleton */}
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="hidden lg:flex items-center gap-3 py-4 px-4 bg-white">
                <Skeleton className="h-6 w-6 rounded-md" />
                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                  <Skeleton className="col-span-4 h-5" />
                  <Skeleton className="col-span-3 h-5" />
                  <div className="col-span-2 flex justify-center"><Skeleton className="h-6 w-16 rounded-md" /></div>
                  <div className="col-span-2 flex justify-center"><Skeleton className="h-5 w-24" /></div>
                  <div className="col-span-1 flex justify-center"><Skeleton className="h-8 w-8 rounded-md" /></div>
                </div>
              </div>
            ))}
            {/* Mobile Rows skeleton */}
            {[1, 2, 3, 4, 5].map(i => (
              <div key={`mob-${i}`} className="flex lg:hidden p-4 border-b border-gray-100 bg-white">
                <div className="flex items-start gap-3 w-full">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-16 rounded-md mt-2" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded-md self-center" />
                </div>
              </div>
            ))}
          </div>
        ) : groupedByRegion.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">Депутаты не найдены</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groupedByRegion.map((group, groupIndex) => {
              const isExpanded = expandedRegions.has(group.region);
              return (
                <div key={group.region} className="bg-white">
                  <button
                    onClick={() => toggleRegion(group.region)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors focus:outline-none text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 pr-4">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-medium shrink-0">
                        {groupIndex + 1}
                      </span>
                      <span className="font-semibold text-gray-900 text-left leading-tight break-words">{group.region}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="bg-green-100 text-green-700 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full" title="Сдали отчет">
                          {group.deputies.filter(d => d.latestReport).length}
                        </span>
                        <span className="bg-red-100 text-red-700 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full" title="Не сдали отчет">
                          {group.deputies.length - group.deputies.filter(d => d.latestReport).length}
                        </span>
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full" title="Всего депутатов">
                          {group.deputies.length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-white">
                      <div className="hidden lg:flex items-center gap-3 py-4 px-4 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="w-6 text-center shrink-0">№</div>
                        <div className="flex-1 grid grid-cols-12 gap-4">
                          <div className="col-span-4">ФИО депутата</div>
                          <div className="col-span-3">Роль В РО</div>
                          <div className="col-span-2 text-center">Уровень</div>
                          <div className="col-span-2 text-center">Дата публикации</div>
                          <div className="col-span-1 text-center">Действие</div>
                        </div>
                      </div>
                      {group.deputies.map((deputy, idx) => {
                        const form = deputy.user.deputyForm;
                        const displayName = form ? `${form.lastName} ${form.firstName} ${form.middleName || ''}` : deputy.user.login;
                        const level = getAbbreviatedLevel(form?.representativeBodyLevel || '-');
                        const role = form?.partyRole || '-';

                        return (
                          <React.Fragment key={deputy.user.userId}>
                            {/* Desktop Row */}
                            <div className="hidden lg:flex items-center gap-3 py-4 px-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                              <div className="w-6 text-center text-sm text-gray-500 shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-4 font-medium text-gray-900 truncate">
                                  {displayName}
                                </div>
                                <div className="col-span-3 text-sm text-gray-600 truncate">
                                  {role}
                                </div>
                                <div className="col-span-2 flex justify-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                    {level}
                                  </span>
                                </div>
                                <div className="col-span-2 flex justify-center text-sm text-gray-500">
                                  {deputy.latestReport ? format(new Date(deputy.latestReport.created_at), 'dd.MM.yyyy') : '-'}
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  {deputy.latestReport ? (
                                    <Link
                                      to={`/seasonal_report/view_report/${deputy.latestReport.id}`}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Посмотреть отчет"
                                    >
                                      <Eye className="h-5 w-5" />
                                    </Link>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Mobile/Tablet Card */}
                            {deputy.latestReport ? (
                              <Link 
                                to={`/seasonal_report/view_report/${deputy.latestReport.id}`}
                                className="flex lg:hidden p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <div className="flex items-start gap-3 w-full">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-medium shrink-0">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-base truncate">{displayName}</div>
                                    <div className="text-sm text-gray-500 mt-1 truncate">Регион: <span className="text-gray-900">{group.region}</span></div>
                                    <div className="text-sm text-gray-500 mt-0.5 truncate">Роль: <span className="text-gray-900">{role}</span></div>
                                    <div className="text-sm text-gray-500 mt-0.5 truncate">
                                      Дата публикации: <span className="text-gray-900">{format(new Date(deputy.latestReport.created_at), 'dd.MM.yyyy')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                        {level}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex self-center pl-2">
                                    <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
                                  </div>
                                </div>
                              </Link>
                            ) : (
                              <div className="flex lg:hidden p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-3 w-full">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 font-medium shrink-0">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-base truncate">{displayName}</div>
                                    <div className="text-sm text-gray-500 mt-1 truncate">Регион: <span className="text-gray-900">{group.region}</span></div>
                                    <div className="text-sm text-gray-500 mt-0.5 truncate">Роль: <span className="text-gray-900">{role}</span></div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                        {level}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <div className={`md:hidden fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${showFab ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`} ref={exportMobileRef}>
        <button 
          onClick={() => setIsMobileExportOpen(true)}
          disabled={isExporting}
          className={`bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center cursor-pointer ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isExporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Export Bottom Sheet */}
      {isMobileExportOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
         <div className="absolute inset-0 bg-black/40 transition-opacity animate-in fade-in duration-300" onClick={() => setIsMobileExportOpen(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full animate-in slide-in-from-bottom duration-300 border-t border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 w-full text-center">Экспорт отчета</h2>
              <button onClick={() => setIsMobileExportOpen(false)} className="absolute right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col py-2">
              <button onClick={() => handleExport('zip')} className="flex items-center gap-4 px-4 py-4 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer text-left w-full">
                <FileArchive className="h-8 w-8 text-purple-600 shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">В формате ZIP</div>
                  <div className="text-sm text-gray-500">Скачать архив со всеми отчетами</div>
                </div>
              </button>
              <div className="h-px bg-gray-100 mx-4" />
              <button onClick={() => handleExport('excel')} className="flex items-center gap-4 px-4 py-4 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer text-left w-full">
                <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">В формате Excel</div>
                  <div className="text-sm text-gray-500">Сводная таблица данных</div>
                </div>
              </button>
              <div className="h-px bg-gray-100 mx-4" />
              <button onClick={() => handleExport('docx')} className="flex items-center gap-4 px-4 py-4 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer text-left w-full">
                <FileText className="h-8 w-8 text-blue-600 shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">В формате Docx</div>
                  <div className="text-sm text-gray-500">Текстовый документ с отчетами</div>
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('reports-view-root')!
      )}
    </Layout>
  );
};

export default DeputyReportsPage;