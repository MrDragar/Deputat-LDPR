import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useFederalPlan } from '../../context/FederalPlanContext';
// FIX: `parse` is imported from its subpath in date-fns v2+.
import { format } from 'date-fns';
import parse from 'date-fns/parse';
import { ru } from 'date-fns/locale/ru';
import type { DailyPlan, PlanEvent, EventCategory, EventTheme } from '../../data/federalPlanData';
import { eventCategoryOptions, eventThemeOptions, eventCategoryConfig } from '../../data/federalPlanData';
import TextInput from '../../components/ui/TextInput';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import IconButton from '../../components/ui/IconButton';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import SingleDateCalendarModal from '../../components/federal-plan/SingleDateCalendarModal';
import HolidayInput from '../../components/ui/HolidayInput';
import JsonImportModal from '../../components/federal-plan/JsonImportModal';
import { useAlert } from '../../context/AlertContext';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, Save, FileJson2 } from 'lucide-react';

type UpsertMode = 'create' | 'edit';

interface Detail {
  id: number;
  key: string;
  value: string;
}

interface EventState extends Omit<PlanEvent, 'details' | 'category' | 'theme'> {
  details: Detail[];
  category: EventCategory | '';
  theme: EventTheme | '';
}

const FederalPlanUpsertPage: React.FC<{ mode: UpsertMode }> = ({ mode }) => {
  const { date: dateParam } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { plans, getPlanByDate, addPlan, updatePlan, deletePlan } = useFederalPlan();
  const [searchParams] = useSearchParams();
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState<Omit<DailyPlan, 'events'> & { events: EventState[] } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isJsonModalOpen, setJsonModalOpen] = useState(false);
  
  const categoryOptionsWithPlaceholder = useMemo(() => [{ value: '', label: 'Выберите категорию...' }, ...eventCategoryOptions], []);
  const themeOptionsWithPlaceholder = useMemo(() => [{ value: '', label: 'Выберите тему...' }, ...eventThemeOptions], []);

  const existingDates = useMemo(() => {
    return plans
      .filter(p => mode === 'edit' ? p.date !== dateParam : true) // Exclude current date in edit mode
      .map(p => parse(p.date, 'yyyy-MM-dd', new Date()));
  }, [plans, mode, dateParam]);

  useEffect(() => {
    if (mode === 'edit' && dateParam) {
      const planToEdit = getPlanByDate(dateParam);
      if (planToEdit) {
        const mappedEvents = planToEdit.events.map(e => ({
            ...e,
            details: Object.entries(e.details).map(([key, value], i) => ({ id: Date.now() + i, key, value: value || '' }))
        }));

        const categoryOrder = Object.keys(eventCategoryConfig);
        mappedEvents.sort((a, b) => {
            const indexA = a.category ? categoryOrder.indexOf(a.category) : categoryOrder.length;
            const indexB = b.category ? categoryOrder.indexOf(b.category) : categoryOrder.length;
            return indexA - indexB;
        });

        setFormData({
          ...planToEdit,
          events: mappedEvents,
        });
      } else {
        navigate('/'); // Redirect if plan not found
      }
    } else if (mode === 'create') {
      const dateFromQuery = searchParams.get('date');
      setFormData({
        date: dateFromQuery || '',
        holidays: [],
        events: [],
      });
    }
  }, [mode, dateParam, getPlanByDate, navigate, searchParams]);

  const handleJsonImport = (plan: DailyPlan): string | void => {
    if (!formData) return;

    if (mode === 'create') {
        const dateExists = plans.some(p => p.date === plan.date);
        if (dateExists) {
            return `Ошибка: План на дату ${plan.date} уже существует. Пожалуйста, выберите другую дату в JSON или перейдите в режим редактирования.`;
        }
    }

    const mappedEvents: EventState[] = plan.events.map((e, eventIndex) => ({
      ...e,
      id: Date.now() + eventIndex, // Ensure unique client-side ID
      category: e.category || '', // Handle potential empty values from JSON
      theme: e.theme || '',
      details: Object.entries(e.details).map(([key, value], detailIndex) => ({
        id: Date.now() + eventIndex * 1000 + detailIndex, // Ensure unique client-side ID
        key,
        value: value || '',
      })),
    }));

    setFormData({
      date: plan.date,
      holidays: plan.holidays,
      events: mappedEvents,
    });
    setErrors({});
    setJsonModalOpen(false);
  };

  const handleDateSelect = (day: Date) => {
    if(formData) {
        const newDate = format(day, 'yyyy-MM-dd');
        setFormData({ ...formData, date: newDate });
        if (errors.date) {
            setErrors(prev => ({ ...prev, date: '' }));
        }
    }
  };

  const handleHolidaysChange = (newHolidays: string[]) => {
    if(formData) {
        setFormData({ ...formData, holidays: newHolidays });
    }
  };
  
  const addEvent = () => {
    if(formData) {
        const newEvent: EventState = {
            id: Date.now(),
            title: '',
            category: '',
            theme: '',
            isInfostrike: false,
            details: [],
        };
        setFormData({ ...formData, events: [...formData.events, newEvent]});
    }
  };

  const removeEvent = (eventId: number) => {
    if(formData) {
        setFormData({ ...formData, events: formData.events.filter(e => e.id !== eventId)});
    }
  };

  const handleEventChange = <K extends keyof EventState>(eventId: number, field: K, value: EventState[K]) => {
     if(formData) {
        setFormData({
            ...formData,
            events: formData.events.map(e => e.id === eventId ? { ...e, [field]: value } : e)
        });
        
        if (field === 'category' && errors[`event-category-${eventId}`]) {
            setErrors(prev => ({ ...prev, [`event-category-${eventId}`]: '' }));
        }
        if (field === 'theme' && errors[`event-theme-${eventId}`]) {
            setErrors(prev => ({ ...prev, [`event-theme-${eventId}`]: '' }));
        }
    }
  };

  const addDetail = (eventId: number) => {
      if(formData) {
        const newDetail: Detail = { id: Date.now(), key: '', value: ''};
        setFormData({
            ...formData,
            events: formData.events.map(e => e.id === eventId ? { ...e, details: [...e.details, newDetail]} : e)
        });
    }
  };

  const removeDetail = (eventId: number, detailId: number) => {
    if(formData) {
        setFormData({
            ...formData,
            events: formData.events.map(e => e.id === eventId ? { ...e, details: e.details.filter(d => d.id !== detailId)} : e)
        });
    }
  };

  const handleDetailChange = (eventId: number, detailId: number, field: 'key' | 'value', value: string) => {
    if(formData) {
        setFormData({
            ...formData,
            events: formData.events.map(e => e.id === eventId ? { ...e, details: e.details.map(d => d.id === detailId ? { ...d, [field]: value} : d)} : e)
        });
    }
  };
  
  const handleSave = () => {
    if (!formData) return;

    const newErrors: Record<string, string> = {};
    if (mode === 'create' && !formData.date) {
      newErrors.date = "Пожалуйста, выберите дату.";
    }
    
    formData.events.forEach(event => {
        if (!event.category) {
          newErrors[`event-category-${event.id}`] = "Категория обязательна.";
        }
        if (!event.theme) {
          newErrors[`event-theme-${event.id}`] = "Тема обязательна.";
        }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showAlert('error', 'Ошибка валидации', 'Пожалуйста, заполните все обязательные поля, отмеченные красным.');
      return;
    }

    const categoryOrder = Object.keys(eventCategoryConfig);
    const sortedEventsToSave = [...formData.events].sort((a, b) => {
        const indexA = a.category ? categoryOrder.indexOf(a.category) : categoryOrder.length;
        const indexB = b.category ? categoryOrder.indexOf(b.category) : categoryOrder.length;
        return indexA - indexB;
    });

    const finalPlan: DailyPlan = {
      ...formData,
      holidays: formData.holidays.filter(h => h.trim() !== ''),
      events: sortedEventsToSave.map(({ details, ...event }) => ({
        ...event,
        details: details.reduce((acc, detail) => {
            if (detail.key.trim()) acc[detail.key as keyof PlanEvent['details']] = detail.value;
            return acc;
        }, {} as PlanEvent['details'])
      })) as PlanEvent[] // Cast to final type
    };
    
    if (mode === 'create') {
        addPlan(finalPlan);
    } else {
        updatePlan(finalPlan);
    }
    navigate('/');
  };

  const handleDeleteDate = () => {
    if(dateParam) {
        deletePlan(dateParam);
        setDeleteModalOpen(false);
        navigate('/');
    }
  };
  
  if (!formData) return <div className="p-6 text-center">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors mb-4">
                <ArrowLeft size={16} />
                Вернуться к федеральному плану
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Создание плана на дату' : `Редактирование: ${format(parse(formData.date, 'yyyy-MM-dd', new Date()), 'd MMMM yyyy', {locale: ru})}`}
            </h1>
          </div>
          
          {/* Main form content */}
          <div className="space-y-6">
            {mode === 'create' && (
              <button 
                type="button"
                onClick={() => setJsonModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileJson2 className="h-5 w-5" />
                <span>Использовать JSON</span>
              </button>
            )}

            {mode === 'create' && (
              <div> {/* Wrapper to ensure it's a direct child for space-y-6 */}
                <div className="p-4 border rounded-lg bg-slate-50">
                    <h2 className="font-semibold text-lg mb-4 text-gray-800">Выберите дату</h2>
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => setCalendarOpen(true)} 
                        className={`w-full pl-4 pr-4 py-3 border rounded-lg shadow-sm bg-white text-left text-base flex items-center justify-start focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.date ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                      >
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-4" />
                        <span className={!formData.date ? 'text-gray-500' : 'text-gray-900'}>
                          {formData.date ? format(parse(formData.date, 'yyyy-MM-dd', new Date()), 'd MMMM yyyy', {locale: ru}) : 'Нажмите, чтобы выбрать дату'}
                        </span>
                      </button>
                       {errors.date && <p className="mt-2 text-sm text-red-600">{errors.date}</p>}
                    </div>
                </div>
                 <SingleDateCalendarModal 
                    isOpen={isCalendarOpen}
                    onClose={() => setCalendarOpen(false)}
                    selectedDate={formData.date ? parse(formData.date, 'yyyy-MM-dd', new Date()) : new Date()}
                    onDateSelect={(day) => {
                        handleDateSelect(day);
                        setCalendarOpen(false);
                    }}
                    disabledDates={existingDates}
                />
              </div>
            )}

            <div className="p-4 border rounded-lg bg-slate-50">
                <h2 className="font-semibold text-lg mb-4 text-gray-800">Праздники</h2>
                <HolidayInput
                    value={formData.holidays}
                    onChange={handleHolidaysChange}
                    placeholder="Введите название праздника и нажмите Enter или запятую..."
                />
            </div>

            <div>
                <h2 className="font-semibold text-lg text-gray-800 mb-4">События</h2>
                <div className="space-y-6">
                    {formData.events.map((event, index) => {
                        const categoryConfig = event.category ? eventCategoryConfig[event.category] : null;
                        const isCategorySelected = !!categoryConfig;

                        return (
                            <div key={event.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                <div className={`flex justify-between items-center p-4 transition-colors duration-300 ${isCategorySelected ? categoryConfig.colors.bg : 'bg-slate-50 border-b'}`}>
                                    <h3 className={`text-lg font-bold ${isCategorySelected ? 'text-white' : 'text-gray-800'}`}>Событие #{index + 1}</h3>
                                    <IconButton
                                        icon={Trash2}
                                        onClick={() => removeEvent(event.id)}
                                        className={isCategorySelected ? 'text-white/70 hover:bg-white/20 hover:text-white' : 'text-red-600 hover:bg-red-100'}
                                        aria-label="Удалить событие"
                                    />
                                </div>
                                
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-y-6">
                                        <TextInput name="title" label="Название события" value={event.title} onChange={(_, val) => handleEventChange(event.id, 'title', val)} />
                                        <Select name="category" label="Категория" options={categoryOptionsWithPlaceholder} value={event.category} onChange={(_, val) => handleEventChange(event.id, 'category', val as EventCategory)} required error={errors[`event-category-${event.id}`]} />
                                        <Select name="theme" label="Тема" options={themeOptionsWithPlaceholder} value={event.theme} onChange={(_, val) => handleEventChange(event.id, 'theme', val as EventTheme)} required error={errors[`event-theme-${event.id}`]} />
                                        <div>
                                            <Switch id={`infostrike-${event.id}`} label="Инфоудар" checked={event.isInfostrike} onChange={val => handleEventChange(event.id, 'isInfostrike', val)} />
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h3 className="font-semibold text-gray-700 mb-4">Детали</h3>
                                        <div className="space-y-6">
                                        {event.details.map((detail, detailIndex) => (
                                            <div key={detail.id} className="p-4 rounded-md border bg-slate-50/50">
                                                <div className="flex justify-between items-center mb-4">
                                                  <h4 className="font-semibold text-gray-700">Деталь #{detailIndex + 1}</h4>
                                                  <IconButton 
                                                    icon={Trash2} 
                                                    onClick={() => removeDetail(event.id, detail.id)} 
                                                    className="text-gray-500 hover:bg-red-100 hover:text-red-600"
                                                    aria-label={`Удалить деталь #${detailIndex + 1}`} 
                                                  />
                                                </div>
                                                <div className="space-y-4">
                                                    <TextInput name="detail-key" label="Заголовок детали" value={detail.key} onChange={(_, val) => handleDetailChange(event.id, detail.id, 'key', val)} placeholder="Например, 'Главный тезис'" />
                                                    <TextInput name="detail-value" label="Описание детали" type="textarea" value={detail.value} onChange={(_, val) => handleDetailChange(event.id, detail.id, 'value', val)} placeholder="Содержание..." />
                                                </div>
                                            </div>
                                        ))}
                                        </div>
                                        <button onClick={() => addDetail(event.id)} className="mt-4 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">
                                            <Plus className="h-4 w-4" /> Добавить деталь
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <button onClick={addEvent} className="mt-6 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">
                    <Plus className="h-4 w-4" /> Добавить событие
                </button>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end items-center gap-4 mt-8 pt-6 border-t">
              <button 
                  type="button"
                  onClick={handleSave} 
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 order-1 sm:order-2"
              >
                  <Save className="h-5 w-5" />
                  <span>Сохранить изменения</span>
              </button>
              {mode === 'edit' && (
                  <button 
                      type="button"
                      onClick={() => setDeleteModalOpen(true)} 
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 order-2 sm:order-1"
                  >
                      <Trash2 className="h-5 w-5" />
                      <span>Удалить дату</span>
                  </button>
              )}
          </div>
        </div>
      </div>

      <JsonImportModal
        isOpen={isJsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        onImport={handleJsonImport}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteDate}
        title="Удалить дату?"
        confirmButtonVariant="danger"
        confirmButtonText="Удалить"
      >
        Вы уверены, что хотите удалить эту дату и все связанные с ней события? Это действие необратимо.
      </ConfirmationModal>
    </div>
  );
};

export default FederalPlanUpsertPage;