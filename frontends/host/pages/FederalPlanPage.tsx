import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFederalPlan } from '../context/FederalPlanContext';
import { eventCategoryConfig } from '../data/federalPlanData';
import type { DailyPlan, EventCategory, PlanEvent } from '../data/federalPlanData';
import EventCard from '../components/federal-plan/EventCard';
import FilterTabs from '../components/federal-plan/FilterTabs';
import HolidayList from '../components/federal-plan/HolidayList';
import TextInput from '../components/ui/TextInput';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { eachDayOfInterval, format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Search, Calendar, Plus, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FederalPlanPage: React.FC = () => {
  const { user } = useAuth();
  const { plans } = useFederalPlan();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: undefined });
  const [activeFilter, setActiveFilter] = useState<EventCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFabVisible, setIsFabVisible] = useState(true);

  const isAdmin = user && (user.role === 'admin' || user.role === 'employee');

  useEffect(() => {
    const mainContentArea = document.querySelector('main');
    if (!mainContentArea) return;

    const handleScroll = () => {
      // Show FAB only when scrolled near the top
      if (mainContentArea.scrollTop > 50) {
        setIsFabVisible(false);
      } else {
        setIsFabVisible(true);
      }
    };

    mainContentArea.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mainContentArea.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const displayedDays = useMemo(() => {
    if (!dateRange?.from) return [];
    
    const start = dateRange.from;
    const end = dateRange.to || dateRange.from;

    const daysInInterval = eachDayOfInterval({ start, end });

    return daysInInterval.map(day => {
        const dateString = format(day, 'yyyy-MM-dd');
        const plan = plans.find(p => p.date === dateString);
        if (plan) return plan;
        return { date: dateString, holidays: [], events: [] };
    });
  }, [dateRange, plans]);

  const eventCounts = useMemo(() => {
    const counts: Record<EventCategory | 'all', number> = {
      'all': 0,
      'МЕРОПРИЯТИЯ ПАРТИИ': 0,
      'МЕРОПРИЯТИЯ МОЛОДЕЖНОЙ ОРГАНИЗАЦИИ': 0,
      'ЗАКОНОТВОРЧЕСКАЯ ДЕЯТЕЛЬНОСТЬ': 0,
      'АГИТАЦИОННАЯ ВОЛНА': 0,
      'МЕРОПРИЯТИЯ ФРАКЦИИ В ГД': 0,
    };

    displayedDays.forEach(day => {
        day.events.forEach(event => {
            counts.all++;
            if (event.category in counts) {
                counts[event.category]++;
            }
        });
    });

    return counts;
  }, [displayedDays]);
  
  const renderSelectedDateRange = () => {
    if (!dateRange?.from) {
        return 'Период не выбран';
    }
    const start = format(dateRange.from, 'd MMMM yyyy', { locale: ru });
    if (!dateRange.to || isSameDay(dateRange.from, dateRange.to)) {
        return start;
    }
    const end = format(dateRange.to, 'd MMMM yyyy', { locale: ru });
    return `${start} - ${end}`;
  };

  return (
    <>
      <div className="bg-white sm:rounded-xl sm:border border-gray-200 sm:shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center gap-4">
            <div>
            </div>
            {isAdmin && (
                <Link
                    to="/federal-plan/create"
                    className="hidden sm:flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
                >
                    <Plus className="h-5 w-5" />
                    <span>Добавить дату</span>
                </Link>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                <TextInput
                    name="search"
                    placeholder="Поиск по ключевым словам..."
                    value={searchTerm}
                    onChange={(_, val) => setSearchTerm(val)}
                    icon={<Search className="h-5 w-5 text-gray-400" />}
                />
            </div>
            <FilterTabs 
              activeFilter={activeFilter} 
              setActiveFilter={setActiveFilter} 
              counts={eventCounts}
            />
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 bg-slate-50">
            {displayedDays.length > 1 && (
              <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                      Показаны события за период
                  </h2>
                  <p className="text-gray-500 font-semibold">{renderSelectedDateRange()}</p>
              </div>
            )}
          
            {displayedDays.length > 0 ? (
                <div className="space-y-10">
                    {displayedDays.map(dayPlan => {
                        const dayDate = new Date(dayPlan.date + 'T12:00:00Z');

                        const filteredEventsForDay = dayPlan.events.filter(event => {
                            if (activeFilter !== 'all' && event.category !== activeFilter) {
                                return false;
                            }
                            if (searchTerm.trim() !== '') {
                                const lowercasedTerm = searchTerm.toLowerCase();
                                const searchableContent = [
                                    event.title,
                                    event.theme,
                                    ...Object.values(event.details).filter(Boolean)
                                ].join(' ').toLowerCase();
                                if (!searchableContent.includes(lowercasedTerm)) {
                                    return false;
                                }
                            }
                            return true;
                        });
                        
                        const groupedEvents = filteredEventsForDay.reduce((acc, event) => {
                            const category = event.category;
                            if (!acc[category]) acc[category] = [];
                            acc[category].push(event);
                            return acc;
                        }, {} as Record<EventCategory, PlanEvent[]>);

                        const orderedCategories = Object.keys(groupedEvents).sort((a, b) => 
                            Object.keys(eventCategoryConfig).indexOf(a) - Object.keys(eventCategoryConfig).indexOf(b)
                        );
                        
                        const dateExistsInPlan = plans.some(p => p.date === dayPlan.date);

                        const NoEventsMessage = () => {
                            if (dayPlan.events.length > 0) {
                                return (
                                    <>
                                        <h3 className="text-base font-medium text-gray-800">Нет событий, соответствующих фильтрам</h3>
                                        <p className="mt-1 text-sm text-gray-500">Попробуйте изменить параметры поиска или сбросить фильтры.</p>
                                    </>
                                );
                            }
                        
                            if (dayPlan.holidays.length > 0) {
                                return (
                                    <>
                                        <h3 className="text-base font-medium text-gray-800">Нет запланированных событий</h3>
                                        <p className="mt-1 text-sm text-gray-500">На эту дату запланированы только праздники.</p>
                                    </>
                                );
                            }
                            
                            return (
                                <>
                                    <h3 className="text-base font-medium text-gray-800">В этот день нет праздников и событий</h3>
                                    {isAdmin ? (
                                        <p className="mt-1 text-sm text-gray-500">
                                            Вы можете <Link to={`/federal-plan/create?date=${dayPlan.date}`} className="text-blue-600 hover:underline font-semibold">добавить запись</Link> на эту дату.
                                        </p>
                                    ) : (
                                        <p className="mt-1 text-sm text-gray-500">Выберите другую дату в календаре.</p>
                                    )}
                                </>
                            );
                        };

                        return (
                            <div key={dayPlan.date}>
                                <HolidayList 
                                    holidays={dayPlan.holidays} 
                                    date={dayDate}
                                    showEdit={isAdmin && dateExistsInPlan}
                                    dateString={dayPlan.date}
                                />
                                
                                {orderedCategories.length > 0 ? (
                                    <div className="mt-6 space-y-8">
                                        {orderedCategories.map(category => {
                                            const config = eventCategoryConfig[category as EventCategory];
                                            const events = groupedEvents[category as EventCategory];
                                            return (
                                                <div key={category}>
                                                    <div className="flex gap-3 mb-4">
                                                        <div className={`w-1.5 flex-shrink-0 rounded-full ${config.colors.bg}`}></div>
                                                        <h3 className="text-xl font-bold text-gray-800 leading-snug">{config.fullName}</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                                        {events.map(event => <EventCard key={event.id} event={event} />)}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="mt-6 text-center py-10 bg-white rounded-lg border border-gray-200">
                                        <NoEventsMessage />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-800">Даты не выбраны</h2>
                    <p className="mt-2 text-gray-500">Пожалуйста, выберите день или период в календаре.</p>
                </div>
            )}
        </div>
      </div>
       {isAdmin && (
        <Link
            to="/federal-plan/create"
            className={`sm:hidden fixed bottom-6 right-6 z-30 flex items-center justify-center h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-300 ease-in-out hover:scale-105 ${isFabVisible ? 'translate-y-0' : 'translate-y-24'}`}
            aria-label="Добавить дату"
        >
            <Plus className="h-7 w-7" />
        </Link>
    )}
    </>
  );
};

export default FederalPlanPage;