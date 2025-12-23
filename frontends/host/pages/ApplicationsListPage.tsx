import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { RegistrationForm } from '../types';
import { ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import TextInput from '../components/ui/TextInput';
import Select from '../components/ui/Select';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { DateRange } from 'react-day-picker';

const ApplicationsListPage: React.FC = () => {
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date_desc');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        const data = await api.getForms();
        setForms(data);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить заявки.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const filteredAndSortedForms = useMemo(() => {
    let processedForms = [...forms];

    // Filtering by search term
    if (searchTerm) {
      processedForms = processedForms.filter(form =>
        `${form.lastName} ${form.firstName} ${form.middleName}`
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
  
  const sortOptions = [
      { value: 'date_desc', label: 'Сначала новые' },
      { value: 'date_asc', label: 'Сначала старые' },
      { value: 'name_asc', label: 'По имени (А-Я)' },
      { value: 'name_desc', label: 'По имени (Я-А)' },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Заявки кандидатов</h1>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center text-gray-500">
          Загрузка...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Заявки кандидатов</h1>
        <div className="bg-white rounded-lg border border-red-300 shadow-sm p-6 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
        <div className="flex items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Заявки кандидатов</h1>
            <span className="bg-blue-100 text-blue-700 font-semibold px-3 py-1 text-sm rounded-full">
                {filteredAndSortedForms.length}
            </span>
        </div>
      
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                 <TextInput
                    name="search"
                    type="text"
                    placeholder="Поиск по ФИО..."
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

      {filteredAndSortedForms.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <h3 className="text-xl font-medium text-gray-800">
            {forms.length > 0 ? 'Заявки не найдены' : 'Нет новых заявок'}
          </h3>
          <p className="mt-2 text-gray-500">
            {forms.length > 0 ? 'Попробуйте изменить параметры фильтрации.' : 'На данный момент нет анкет для обработки.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredAndSortedForms.map(form => (
              <li key={form.user}>
                <Link 
                  to={`/applications/${form.user}`} 
                  className="block p-4 sm:p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-blue-700 truncate">
                        {form.lastName} {form.firstName} {form.middleName}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Регион:</span> {form.region}
                      </p>
                       <p className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Дата подачи:</span> {new Date(form.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ApplicationsListPage;