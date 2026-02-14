import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFederalPlan } from '../context/FederalPlanContext';
import { partyImageConfig } from '../data/federalPlanData';
import type { PartyImage, PlanEvent } from '../data/federalPlanData';
import EventCard from '../components/federal-plan/EventCard';
import FilterTabs from '../components/federal-plan/FilterTabs';
import HolidayList from '../components/federal-plan/HolidayList';
import TextInput from '../components/ui/TextInput';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { eachDayOfInterval, format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { Search, Calendar, Plus, Download, FileJson, FileText, File, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { useAlert } from '../context/AlertContext';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import saveAs from 'file-saver';

const FederalPlanPage: React.FC = () => {
  const { user } = useAuth();
  // Теперь dateRange и setDateRange берем из контекста, что сохраняет состояние при переходах внутри scope
  const { plans, loading, dateRange, setDateRange } = useFederalPlan();
  const { showAlert } = useAlert();
  const [activeFilter, setActiveFilter] = useState<PartyImage | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFabVisible, setIsFabVisible] = useState(true);
  
  // Export State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(exportMenuRef, () => setIsExportMenuOpen(false));

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
    const counts: Record<PartyImage | 'all', number> = {
      'all': 0,
      'Перемены после СВО': 0,
      'Державность': 0,
      'Наследие': 0,
    };

    displayedDays.forEach(day => {
        day.events.forEach(event => {
            counts.all++;
            if (event.partyImage in counts) {
                counts[event.partyImage]++;
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

  const handleExportJson = () => {
      const dataStr = JSON.stringify(plans, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `federal_plan_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsExportMenuOpen(false);
      showAlert('success', 'Экспорт завершен', 'Файл JSON успешно скачан.');
  };

  const handleExportDocx = async () => {
      if (displayedDays.length === 0) {
          showAlert('warning', 'Нет данных', 'Нет отображаемых дней для экспорта.');
          return;
      }

      setIsExporting(true);
      setIsExportMenuOpen(false);
      showAlert('success', 'Генерация DOCX', 'Создание текстового документа...');

      try {
          const docChildren: Paragraph[] = [];

          // Title
          docChildren.push(new Paragraph({
              text: "Федеральный план",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
          }));

          // Date Range subtitle
          if (dateRange?.from) {
              const rangeText = renderSelectedDateRange();
              docChildren.push(new Paragraph({
                  text: `Период: ${rangeText}`,
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 }
              }));
          }

          for (const dayPlan of displayedDays) {
              // Day Heading
              const dateTitle = format(new Date(dayPlan.date), 'd MMMM yyyy, EEEE', { locale: ru });
              docChildren.push(new Paragraph({
                  text: dateTitle.charAt(0).toUpperCase() + dateTitle.slice(1),
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 400, after: 200 },
                  border: {
                      bottom: {
                          color: "E2E8F0",
                          space: 1,
                          style: BorderStyle.SINGLE,
                          size: 6,
                      },
                  },
              }));

              // Holidays Section
              if (dayPlan.holidays.length > 0) {
                  docChildren.push(new Paragraph({
                      children: [
                          new TextRun({
                              text: "Праздники: ",
                              bold: true,
                          }),
                          new TextRun({
                              text: dayPlan.holidays.join(", "),
                          })
                      ],
                      spacing: { after: 200 }
                  }));
              } else {
                   docChildren.push(new Paragraph({
                      children: [
                          new TextRun({
                              text: "Нет праздников",
                              italics: true,
                              color: "718096" // Gray
                          })
                      ],
                      spacing: { after: 200 }
                  }));
              }

              // Filter events based on current view (search/tabs)
              const filteredEventsForDay = dayPlan.events.filter(event => {
                    if (activeFilter !== 'all' && event.partyImage !== activeFilter) return false;
                    if (searchTerm.trim() !== '') {
                        const lowercasedTerm = searchTerm.toLowerCase();
                        const searchableContent = [
                            event.title,
                            event.partyImage,
                            ...Object.values(event.details).filter(Boolean)
                        ].join(' ').toLowerCase();
                        if (!searchableContent.includes(lowercasedTerm)) return false;
                    }
                    return true;
                });

              if (filteredEventsForDay.length > 0) {
                  // Group by Party Image
                  const groupedEvents = filteredEventsForDay.reduce((acc, event) => {
                      const image = event.partyImage;
                      if (!acc[image]) acc[image] = [];
                      acc[image].push(event);
                      return acc;
                  }, {} as Record<PartyImage, PlanEvent[]>);

                  const orderedImages = Object.keys(groupedEvents).sort((a, b) => 
                      Object.keys(partyImageConfig).indexOf(a) - Object.keys(partyImageConfig).indexOf(b)
                  );

                  for (const imageKey of orderedImages) {
                      const config = partyImageConfig[imageKey as PartyImage];
                      const events = groupedEvents[imageKey as PartyImage];

                      // Party Image Subheading
                      docChildren.push(new Paragraph({
                          text: config.label,
                          heading: HeadingLevel.HEADING_2,
                          spacing: { before: 200, after: 100 },
                      }));

                      for (const event of events) {
                          // Event Title line
                          const titleChildren = [
                              new TextRun({
                                  text: event.title,
                                  bold: true,
                                  size: 24 // 12pt
                              })
                          ];
                          
                          if (event.isInfostrike) {
                              titleChildren.push(new TextRun({
                                  text: " [ИНФОУДАР]",
                                  color: "DC2626", // Red
                                  bold: true,
                                  size: 20
                              }));
                          }

                          docChildren.push(new Paragraph({
                              children: titleChildren,
                              spacing: { before: 100, after: 100 },
                              bullet: { level: 0 } // Bulleted list for events
                          }));

                          // Details
                          const details = Object.entries(event.details).filter(([, value]) => !!value);
                          for (const [key, value] of details) {
                              docChildren.push(new Paragraph({
                                  children: [
                                      new TextRun({
                                          text: `${key}: `,
                                          bold: true,
                                          italics: true,
                                          size: 20 // 10pt
                                      }),
                                      new TextRun({
                                          text: value || "",
                                          size: 20
                                      })
                                  ],
                                  indent: { left: 720 }, // Indent details
                                  spacing: { after: 0 }
                              }));
                          }
                          // Spacer after details
                          docChildren.push(new Paragraph({ text: "", spacing: { after: 100 }}));
                      }
                  }
              } else {
                   docChildren.push(new Paragraph({
                      children: [
                          new TextRun({
                              text: "Событий нет",
                              italics: true,
                              color: "718096"
                          })
                      ],
                      spacing: { after: 200 }
                  }));
              }
              
              // Empty line between days
              docChildren.push(new Paragraph({ text: "" }));
          }

          const doc = new Document({
              sections: [{
                  properties: {},
                  children: docChildren,
              }],
          });

          const blob = await Packer.toBlob(doc);
          saveAs(blob, `federal_plan_${new Date().toISOString().slice(0, 10)}.docx`);
          showAlert('success', 'Готово', 'Документ DOCX успешно создан.');

      } catch (error) {
          console.error(error);
          showAlert('error', 'Ошибка', 'Не удалось создать документ DOCX.');
      } finally {
          setIsExporting(false);
      }
  };

  const handleExportPdf = () => {
      setIsExportMenuOpen(false);
      showAlert('warning', 'В разработке', 'Экспорт в PDF будет доступен в следующих обновлениях.');
  };

  return (
    <>
      <div className="bg-white sm:rounded-xl sm:border border-gray-200 sm:shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Федеральный план</h1>
                <p className="mt-1 text-gray-500">Календарь партийных событий и мероприятий</p>
            </div>
            {isAdmin && (
                <div className="flex items-center gap-2">
                    {/* Export Dropdown */}
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            disabled={isExporting}
                            className="hidden sm:flex items-center gap-2 px-4 py-3 text-base font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Download className="h-5 w-5" />
                            <span>Экспортировать</span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button onClick={handleExportJson} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors text-left">
                                    <FileJson className="h-4 w-4" />
                                    JSON
                                </button>
                                <button onClick={handleExportDocx} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors text-left border-t border-gray-50">
                                    <FileText className="h-4 w-4" />
                                    DOCX
                                </button>
                                <button onClick={handleExportPdf} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-gray-50 transition-colors text-left border-t border-gray-50 cursor-not-allowed">
                                    <File className="h-4 w-4" />
                                    PDF (Скоро)
                                </button>
                            </div>
                        )}
                    </div>

                    <Link
                        to="/federal-plan/create"
                        className="hidden sm:flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Добавить дату</span>
                    </Link>
                </div>
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
        <div className="p-4 sm:p-6 bg-slate-50 min-h-[400px]">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                    <p className="text-gray-500 font-medium">Загрузка плана...</p>
                </div>
            ) : displayedDays.length > 1 ? (
              <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                      Показаны события за период
                  </h2>
                  <p className="text-gray-500 font-semibold">{renderSelectedDateRange()}</p>
              </div>
            ) : null}
          
            {!loading && (displayedDays.length > 0 ? (
                <div className="space-y-10">
                    {displayedDays.map(dayPlan => {
                        const dayDate = new Date(dayPlan.date + 'T12:00:00Z');

                        const filteredEventsForDay = dayPlan.events.filter(event => {
                            if (activeFilter !== 'all' && event.partyImage !== activeFilter) {
                                return false;
                            }
                            if (searchTerm.trim() !== '') {
                                const lowercasedTerm = searchTerm.toLowerCase();
                                const searchableContent = [
                                    event.title,
                                    event.partyImage,
                                    ...Object.values(event.details).filter(Boolean)
                                ].join(' ').toLowerCase();
                                if (!searchableContent.includes(lowercasedTerm)) {
                                    return false;
                                }
                            }
                            return true;
                        });
                        
                        const groupedEvents = filteredEventsForDay.reduce((acc, event) => {
                            const image = event.partyImage;
                            if (!acc[image]) acc[image] = [];
                            acc[image].push(event);
                            return acc;
                        }, {} as Record<PartyImage, PlanEvent[]>);

                        const orderedImages = Object.keys(groupedEvents).sort((a, b) => 
                            Object.keys(partyImageConfig).indexOf(a) - Object.keys(partyImageConfig).indexOf(b)
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
                            <div key={dayPlan.date} id={`day-${dayPlan.date}`}>
                                <HolidayList 
                                    id={`day-header-${dayPlan.date}`}
                                    holidays={dayPlan.holidays} 
                                    date={dayDate}
                                    showEdit={isAdmin && dateExistsInPlan}
                                    dateString={dayPlan.date}
                                />
                                
                                {orderedImages.length > 0 ? (
                                    <div className="mt-6 space-y-8">
                                        {orderedImages.map(imageKey => {
                                            const events = groupedEvents[imageKey as PartyImage];
                                            return (
                                                <div key={imageKey}>
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                                        {events.map(event => (
                                                            <div key={event.id} id={`event-card-${event.id}`} className="event-card-wrapper">
                                                                <EventCard event={event} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    // Added px-6 to this container for better mobile padding
                                    <div className="mt-6 text-center py-10 px-2 bg-white rounded-lg border border-gray-200">
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
            ))}
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