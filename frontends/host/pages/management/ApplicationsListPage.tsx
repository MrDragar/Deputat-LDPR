import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { RegistrationForm } from '../../types';
import { ChevronRight, Search, ArrowUpDown, FileArchive, Inbox } from 'lucide-react';
import TextInput from '../../components/ui/TextInput';
import Select from '../../components/ui/Select';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { DateRange } from 'react-day-picker';
import ApplicationsListSkeleton from '../../components/skeletons/ApplicationsListSkeleton';
import { useAlert } from '../../context/AlertContext';
import JSZip from 'jszip';


const POLLING_INTERVAL = 20000; // 20 seconds

const ApplicationsListPage: React.FC = () => {
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date_desc');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { showAlert } = useAlert();


  // Initial data fetch with delayed skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, 300);

    const fetchInitialData = async () => {
      try {
        const data = await api.getForms();
        setForms(data);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить заявки.');
        console.error(err);
      } finally {
        clearTimeout(timer);
        setIsLoading(false);
      }
    };
    fetchInitialData();

    return () => clearTimeout(timer);
  }, []);

  // Set up polling for real-time updates
  useEffect(() => {
    if (isLoading || error) return;

    const pollForUpdates = async () => {
      try {
        const data = await api.getForms();
        setForms(data);
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    let intervalId: number | null = null;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
      } else {
        pollForUpdates(); 
        intervalId = window.setInterval(pollForUpdates, POLLING_INTERVAL);
      }
    };

    if (!document.hidden) {
      intervalId = window.setInterval(pollForUpdates, POLLING_INTERVAL);
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoading, error]);

  const filteredAndSortedForms = useMemo(() => {
    let processedForms = [...forms];

    // Filtering by search term (FIO and Region)
    if (searchTerm) {
      processedForms = processedForms.filter(form =>
        `${form.lastName} ${form.firstName} ${form.middleName} ${form.region}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtering by date range
    if (dateRange?.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        toDate.setHours(23, 59, 59, 999);

        processedForms = processedForms.filter(form => {
            const formDate = new Date(form.createdAt);
            return formDate >= fromDate && formDate <= toDate;
        });
    }

    // Sorting
    switch (sortOption) {
      case 'date_asc':
        processedForms.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'date_desc':
        processedForms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name_asc':
        processedForms.sort((a, b) => a.lastName.localeCompare(b.lastName));
        break;
      case 'name_desc':
        processedForms.sort((a, b) => b.lastName.localeCompare(a.lastName));
        break;
      default:
        break;
    }

    return processedForms;
  }, [forms, searchTerm, sortOption, dateRange]);
  
  const handleDownloadZip = useCallback(async () => {
    if (filteredAndSortedForms.length === 0) {
      showAlert('warning', 'Нет данных для скачивания', 'Отфильтрованный список заявок пуст.');
      return;
    }

    setIsDownloading(true);
    showAlert('success', 'Подготовка архива...', 'Это может занять некоторое время.');

    try {
      const zip = new JSZip();
      
      const formPromises = filteredAndSortedForms.map(formSummary => {
          if (!formSummary.user) {
              return Promise.reject(new Error(`Missing user ID for form: ${formSummary.firstName} ${formSummary.lastName}`));
          }
          return api.getFormById(formSummary.user.toString()).then(fullForm => ({
            // Sanitize filename to remove invalid characters
            filename: `${fullForm.lastName}_${fullForm.firstName}_${fullForm.user}.json`.replace(/[\/\\?%*:|"<>]/g, '-'),
            content: JSON.stringify(fullForm, null, 2)
          }));
        }
      );

      const files = await Promise.all(formPromises);

      files.forEach(file => {
        zip.file(file.filename, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
      link.setAttribute('download', `applications_export_${timestamp}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showAlert('success', 'Архив готов!', 'Загрузка успешно началась.');

    } catch (error) {
      console.error("Ошибка при создании ZIP архива:", error);
      showAlert('error', 'Ошибка экспорта', 'Не удалось создать ZIP архив. Одна или несколько анкет не были загружены.');
    } finally {
      setIsDownloading(false);
    }
  }, [filteredAndSortedForms, showAlert]);
  
  const sortOptions = [
      { value: 'date_desc', label: 'Сначала новые' },
      { value: 'date_asc', label: 'Сначала старые' },
      { value: 'name_asc', label: 'По имени (А-Я)' },
      { value: 'name_desc', label: 'По имени (Я-А)' },
  ];

  if (isLoading) {
    return showSkeleton ? <ApplicationsListSkeleton /> : null;
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Заявки кандидатов</h1>
        <div className="bg-white rounded-lg border border-red-300 shadow-sm p-6 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">Заявки кандидатов</h1>
                  <span className="bg-blue-600 text-white font-semibold px-3 py-1 text-sm rounded-full">
                      {filteredAndSortedForms.length}
                  </span>
              </div>
              <button
                  onClick={handleDownloadZip}
                  disabled={isDownloading || filteredAndSortedForms.length === 0}
                  className="flex items-center justify-center sm:w-auto w-full gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                  <FileArchive className="h-4 w-4" />
                  <span>{isDownloading ? 'Создание архива...' : 'Скачать ZIP'}</span>
              </button>
          </div>
        </div>
      
        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                 <TextInput
                    name="search"
                    type="text"
                    placeholder="Поиск по ФИО или региону..."
                    value={searchTerm}
                    onChange={(_, val) => setSearchTerm(val)}
                    icon={<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />}
                />
              </div>
               <div className="md:col-span-1">
                 <Select 
                    name="sort"
                    value={sortOption}
                    onChange={(_, val) => setSortOption(val)}
                    options={sortOptions}
                    icon={<ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />}
                 />
              </div>
              <div className="md:col-span-1">
                <DateRangePicker
                    date={dateRange}
                    onDateChange={setDateRange}
                />
              </div>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {filteredAndSortedForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
              <Inbox className="h-16 w-16 text-gray-300" />
              <h3 className="mt-6 text-xl font-medium text-gray-800">
                {forms.length > 0 ? 'Заявки не найдены' : 'Нет новых заявок'}
              </h3>
              <p className="mt-2 text-gray-500">
                {forms.length > 0 ? 'Попробуйте изменить параметры фильтрации.' : 'На данный момент нет анкет для обработки.'}
              </p>
            </div>
          ) : (
            <div>
              <ul className="divide-y divide-gray-200">
                {filteredAndSortedForms.map((form, index) => (
                  <li key={form.user}>
                    <Link 
                      to={`/applications/${form.user}`} 
                      className="flex items-start gap-4 p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-100 rounded-full font-semibold text-slate-500 text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-blue-700 truncate">
                          {form.lastName} {form.firstName} {form.middleName}
                        </p>
                        <div className="mt-1 space-y-1 text-sm">
                            <p className="text-gray-600">
                                <span className="font-medium">Регион:</span> {form.region}
                            </p>
                            <p className="text-gray-500">
                                <span className="font-medium">Дата подачи:</span> {new Date(form.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0 self-center" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
    </div>
  );
};

export default ApplicationsListPage;
