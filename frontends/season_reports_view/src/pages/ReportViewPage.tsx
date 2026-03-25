import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { getReportById, updateReport, deleteReport } from '../api';
import { Report } from '../types';
import Layout from '../components/Layout';
import Skeleton from '../components/ui/Skeleton';
import Alert from '../components/ui/Alert';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { 
  Loader2, ArrowLeft, Trash2, Edit, Save, X, FileText, User, 
  BarChart3, Scale, Users, MessageCircle, Shield, Briefcase, 
  FileCheck, MoreHorizontal, Link2, ExternalLink, Menu, MoreVertical, Settings
} from 'lucide-react';

const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string }> = ({ label, value, children, className }) => {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {children ? (
        <div className="mt-1 text-base font-semibold text-gray-900">{children}</div>
      ) : (
        <p className="mt-1 text-base font-semibold text-gray-900 break-words">
          {(value !== null && value !== undefined && value !== '') ? value : '—'}
        </p>
      )}
    </div>
  );
};

const Section: React.FC<{ id: string; title: string; icon: React.ElementType; children: React.ReactNode; }> = ({ id, title, icon: Icon, children }) => (
  <section id={id} className="py-8 scroll-mt-24 first:pt-0">
    <div className="flex items-center gap-3 mb-6">
      <Icon className="h-6 w-6 text-blue-600" />
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    <div className="grid grid-cols-1 gap-y-6">
      {children}
    </div>
  </section>
);

const FullWidthSection: React.FC<{ id: string; title: string; icon: React.ElementType; children: React.ReactNode; }> = ({ id, title, icon: Icon, children }) => (
  <section id={id} className="py-8 scroll-mt-24 first:pt-0">
    <div className="flex items-center gap-3 mb-6">
        <Icon className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    </div>
    {children}
  </section>
);

const ProseItem: React.FC<{ label: string, text?: string | null }> = ({ label, text }) => {
    if (!text) return null;
    return (
        <div>
            <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
            <div className="text-base text-gray-800 bg-slate-50 p-4 rounded-md border border-slate-200 prose whitespace-pre-wrap">
                {text}
            </div>
        </div>
    );
};

const ReportViewPage: React.FC<{ showSidebar?: boolean }> = ({ showSidebar = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editJson, setEditJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const [showFab, setShowFab] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if the scrolling element is the main container
      if (target.tagName !== 'MAIN' && target !== document.documentElement && target !== document.body) {
        return;
      }
      
      const currentScrollY = target.scrollTop || window.scrollY;
      if (currentScrollY < 50) {
        setShowFab(true);
      } else {
        setShowFab(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const responseData = await getReportById(id);
        
        let parsedData = responseData.data;
        if (typeof responseData.data === 'string') {
          try {
            parsedData = JSON.parse(responseData.data);
          } catch (e) {
            console.error('Failed to parse report data string', e);
          }
        }
        
        const normalizedReport = { ...responseData, data: parsedData };
        setReport(normalizedReport);
        setEditJson(parsedData ? JSON.stringify(parsedData, null, 2) : '{}');
      } catch (err: any) {
        setError(err.message || 'Не удалось загрузить отчёт');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleSave = async () => {
    if (!id || !report) return;
    setIsSaving(true);
    setError(null);
    try {
      const parsedData = JSON.parse(editJson);
      const updatedReport = await updateReport(id, { data: parsedData });
      setReport(updatedReport);
      setIsEditing(false);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Неверный формат JSON');
      } else {
        setError(err.message || 'Не удалось сохранить отчёт');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    setError(null);
    try {
      await deleteReport(id);
      navigate('/seasonal_report');
    } catch (err: any) {
      setError(err.message || 'Не удалось удалить отчёт');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout showSidebar={showSidebar}>
        <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-40 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          </div>
          <div className="space-y-8">
            <div>
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
            <div>
              <Skeleton className="h-8 w-48 mb-6" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout showSidebar={showSidebar}>
        <div className="mb-4">
          <button onClick={() => navigate('/seasonal_report')} className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-1" /> Назад к списку
          </button>
        </div>
        <Alert type="error" title="Ошибка" message={error || 'Отчет не найден'} />
      </Layout>
    );
  }

  const reportData = report.data;

  const legislationTotal = reportData?.legislation?.length || 0;
  const legislationAccepted = reportData?.legislation?.filter((l: any) => l.status === 'Принято').length || 0;
  const legislationRejected = reportData?.legislation?.filter((l: any) => l.status === 'Отклонено').length || 0;
  const legislationIntroduced = legislationTotal - legislationAccepted - legislationRejected;
  
  const totalRequests = Object.values(reportData?.citizen_requests?.requests || {}).reduce((acc: number, val: any) => acc + Number(val), 0);
  
  const receptionLabels: Record<string, string> = {
    aug_22_23: '22-23 августа',
    aug_29_30: '29-30 августа',
    sep_5_8: '5-8 сентября',
    sep_19_20: '19-20 сентября',
    oct_17_18: '17-18 октября',
    nov_14_15: '14-15 ноября',
    dec_5_6: '5-6 декабря'
  };
  const receptionKeys = Object.keys(receptionLabels);
  const activeReceptions = receptionKeys.filter(key => {
    const val = reportData?.citizen_requests?.citizen_day_receptions?.[key];
    return val && val !== '0' && val !== 0;
  });
  const receptionCount = activeReceptions.length;

  return (
    <Layout showSidebar={showSidebar}>
      <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
          <div>
            <button onClick={() => navigate('/seasonal_report')} className="flex items-center text-blue-600 hover:text-blue-800 mb-2 cursor-pointer">
              <ArrowLeft className="h-4 w-4 mr-1" /> Назад к списку
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Отчет от {new Date(report.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              ID: {report.id} | Создан: {new Date(report.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
          
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            {report.report_link && (
              <a 
                href={report.report_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть PDF
              </a>
            )}
            <button 
              onClick={() => setIsEditing(true)}
              disabled={isEditing}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                isEditing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer'
              }`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Изменить JSON
            </button>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isDeleting || isEditing}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                isEditing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
              }`}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Удалить
            </button>
          </div>
        </div>

        {error && (
          <Alert type="error" title="Ошибка" message={error} onClose={() => setError(null)} className="mb-6" />
        )}

        {isEditing ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Редактирование данных отчёта (JSON)</h2>
            <div className="w-full h-96 rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <textarea
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm bg-gray-50 border-none focus:ring-0 outline-none resize-none"
              />
            </div>
            <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditJson(JSON.stringify(report.data, null, 2));
                  setError(null);
                }}
                className="w-full sm:w-auto px-6 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors flex items-center justify-center cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center cursor-pointer"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить изменения
              </button>
            </div>
          </div>
        ) : (
          <main className="divide-y divide-gray-200">
            {/* General Info */}
            {reportData?.general_info && (
              <Section id="general-info" title="Общая информация" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <DetailItem label="ФИО" value={reportData.general_info.full_name} />
                  <DetailItem label="Должность" value={reportData.general_info.position} />
                  <DetailItem label="Округ" value={reportData.general_info.district} />
                  <DetailItem label="Регион" value={reportData.general_info.region} />
                  <DetailItem label="Срок полномочий" value={`${reportData.general_info.term_start || '—'} - ${reportData.general_info.term_end || '—'}`} />
                  <DetailItem label="Орган власти" value={reportData.general_info.authority_name} />
                  <DetailItem label="Позиция в ЛДПР" value={reportData.general_info.ldpr_position} />
                </div>
                
                {reportData.general_info.committees && reportData.general_info.committees.length > 0 && reportData.general_info.committees[0] !== "" && (
                  <DetailItem label="Комитеты" className="mt-6">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {reportData.general_info.committees.map((committee: string, i: number) => (
                        <span key={i} className="bg-slate-100 text-slate-800 text-sm px-3 py-1 rounded-md border border-slate-200">
                          {committee}
                        </span>
                      ))}
                    </div>
                  </DetailItem>
                )}

                {reportData.general_info.links && reportData.general_info.links.length > 0 && reportData.general_info.links[0] !== "" && (
                  <DetailItem label="Ссылки" className="mt-6">
                    <ul className="list-none space-y-2 mt-2">
                      {reportData.general_info.links.map((link: string, i: number) => (
                        <li key={i}>
                          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline break-all">
                            <Link2 size={14}/><span>{link}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </DetailItem>
                )}
              </Section>
            )}

            {/* Sessions Attended */}
            {reportData?.general_info?.sessions_attended && (
              <FullWidthSection id="sessions" title="Посещение заседаний" icon={BarChart3}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-500 mb-1">Коллегиальный орган</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {reportData.general_info.sessions_attended.attended || '0'} <span className="text-lg text-slate-400 font-normal">/ {reportData.general_info.sessions_attended.total || '0'}</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-500 mb-1">Комитеты / Комиссии</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {reportData.general_info.sessions_attended.committee_attended || '0'} <span className="text-lg text-slate-400 font-normal">/ {reportData.general_info.sessions_attended.committee_total || '0'}</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-500 mb-1">Фракция ЛДПР</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {reportData.general_info.sessions_attended.ldpr_attended || '0'} <span className="text-lg text-slate-400 font-normal">/ {reportData.general_info.sessions_attended.ldpr_total || '0'}</span>
                    </p>
                  </div>
                </div>
              </FullWidthSection>
            )}

            {/* Legislation */}
            {reportData?.legislation && reportData.legislation.length > 0 && (
              <FullWidthSection id="legislation" title={`Законопроекты (${legislationTotal})`} icon={Scale}>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Принято: {legislationAccepted}</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Внесено: {legislationIntroduced}</span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Отклонено: {legislationRejected}</span>
                </div>
                <div className="space-y-4">
                  {reportData.legislation.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                        <h3 className="font-bold text-gray-800 text-lg order-2 sm:order-1">{item.title || 'Без названия'}</h3>
                        {item.status && (
                          <span className={`px-2.5 py-1 text-xs rounded-full font-medium whitespace-nowrap order-1 sm:order-2 self-start sm:ml-4 ${
                            item.status === 'Принято' ? 'bg-green-100 text-green-800' :
                            item.status === 'Отклонено' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-y-4">
                        {item.summary && <DetailItem label="Краткое описание" value={item.summary} />}
                        {item.status === 'Отклонено' && item.rejection_reason && (
                          <DetailItem label="Причина отказа" value={item.rejection_reason} />
                        )}
                        {item.links && item.links.length > 0 && item.links[0] !== "" && (
                          <DetailItem label="Ссылки">
                            <ul className="list-none space-y-2 mt-1">
                              {item.links.map((link: string, i: number) => (
                                <li key={i}>
                                  <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline break-all">
                                    <Link2 size={14}/><span>{link}</span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </DetailItem>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </FullWidthSection>
            )}

            {/* Citizen Requests */}
            {reportData?.citizen_requests && (
              <FullWidthSection id="citizen-requests" title="Обращения граждан" icon={Users}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-blue-800 mb-1">Личных приемов</p>
                    <p className="text-3xl font-bold text-blue-900">{reportData.citizen_requests.personal_meetings || '0'}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <p className="text-sm font-medium text-emerald-800 mb-1">Ответов дано</p>
                    <p className="text-3xl font-bold text-emerald-900">{reportData.citizen_requests.responses || '0'}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <p className="text-sm font-medium text-purple-800 mb-1">Официальных запросов</p>
                    <p className="text-3xl font-bold text-purple-900">{reportData.citizen_requests.official_queries || '0'}</p>
                  </div>
                </div>

                {reportData.citizen_requests.requests && Object.keys(reportData.citizen_requests.requests).length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Тематика обращений ({totalRequests})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(reportData.citizen_requests.requests).map(([key, value]) => {
                        if (value === '0' || value === 0) return null;
                        
                        const labels: Record<string, string> = {
                          utilities: 'ЖКХ',
                          pensions_and_social_payments: 'Пенсии и соц. выплаты',
                          improvement: 'Благоустройство',
                          education: 'Образование',
                          svo: 'СВО',
                          road_maintenance: 'Дороги',
                          ecology: 'Экология',
                          medicine_and_healthcare: 'Медицина',
                          public_transport: 'Общественный транспорт',
                          illegal_dumps: 'Свалки',
                          appeals_to_ldpr_chairman: 'Обращения к Председателю ЛДПР',
                          legal_aid_requests: 'Юридическая помощь',
                          integrated_territory_development: 'КРТ',
                          stray_animal_issues: 'Бездомные животные',
                          legislative_proposals: 'Законодательные инициативы'
                        };
                        
                        return (
                          <div key={key} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <span className="text-sm font-medium text-slate-700">{labels[key] || key}</span>
                            <span className="font-bold bg-white px-2.5 py-1 rounded-md border border-slate-200 text-sm text-slate-900">{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {reportData.citizen_requests.citizen_day_receptions && Object.keys(reportData.citizen_requests.citizen_day_receptions).length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Всероссийский прием граждан ({receptionCount}/7)</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(reportData.citizen_requests.citizen_day_receptions).map(([key, value]) => {
                        if (value === 0 || value === '0') return null;
                        return (
                          <div key={key} className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-sm font-medium text-blue-800 flex items-center">
                            <span>{receptionLabels[key] || key}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {reportData.citizen_requests.examples && reportData.citizen_requests.examples.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Примеры обращений ({reportData.citizen_requests.examples.length})</h3>
                    <div className="space-y-4">
                      {reportData.citizen_requests.examples.map((example: any, idx: number) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                          <DetailItem label={`Пример #${idx + 1}`} value={example.text || example} />
                          {example.links && example.links.length > 0 && example.links[0] !== "" && (
                            <DetailItem label="Ссылки" className="mt-3">
                              <ul className="list-none space-y-2 mt-1">
                                {example.links.map((link: string, i: number) => (
                                  <li key={i}>
                                    <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline break-all">
                                      <Link2 size={14}/><span>{link}</span>
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </DetailItem>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </FullWidthSection>
            )}

            {/* SVO Support */}
            {reportData?.svo_support?.projects && reportData.svo_support.projects.length > 0 && (
              <FullWidthSection id="svo-support" title={`Поддержка СВО (${reportData.svo_support.projects.length})`} icon={Shield}>
                <div className="space-y-4">
                  {reportData.svo_support.projects.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <DetailItem label={`Проект #${idx + 1}`} value={item.text || item} />
                      {item.links && item.links.length > 0 && item.links[0] !== "" && (
                        <DetailItem label="Ссылки" className="mt-3">
                          <ul className="list-none space-y-2 mt-1">
                            {item.links.map((link: string, i: number) => (
                              <li key={i}>
                                <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline break-all">
                                  <Link2 size={14}/><span>{link}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </DetailItem>
                      )}
                    </div>
                  ))}
                </div>
              </FullWidthSection>
            )}

            {/* Project Activity */}
            {reportData?.project_activity && reportData.project_activity.length > 0 && (
              <FullWidthSection id="project-activity" title={`Проектная деятельность (${reportData.project_activity.length})`} icon={Briefcase}>
                <div className="space-y-4">
                  {reportData.project_activity.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <h3 className="font-bold text-gray-800 text-lg mb-3">{item.name || 'Без названия'}</h3>
                      <DetailItem label="Результат" value={item.result} />
                    </div>
                  ))}
                </div>
              </FullWidthSection>
            )}

            {/* LDPR Orders */}
            {reportData?.ldpr_orders && reportData.ldpr_orders.length > 0 && (
              <FullWidthSection id="ldpr-orders" title={`Поручения ЛДПР (${reportData.ldpr_orders.length})`} icon={FileCheck}>
                <div className="space-y-4">
                  {reportData.ldpr_orders.map((item: any, idx: number) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="grid grid-cols-1 gap-y-4">
                        <DetailItem label="Поручение" value={item.instruction} />
                        <DetailItem label="Работа" value={item.action} />
                      </div>
                    </div>
                  ))}
                </div>
              </FullWidthSection>
            )}

            {/* Other Info */}
            {reportData?.other_info && (
              <FullWidthSection id="other-info" title="Дополнительная информация" icon={MoreHorizontal}>
                <ProseItem label="Иная значимая информация" text={reportData.other_info} />
              </FullWidthSection>
            )}
          </main>
        )}
      </div>

      {/* Mobile FAB */}
      <div className={`sm:hidden fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${showFab ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <button 
          onClick={() => setIsMobileActionsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
        >
          <Settings className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Actions Bottom Sheet */}
      {isMobileActionsOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 transition-opacity animate-in fade-in duration-300" onClick={() => setIsMobileActionsOpen(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] w-full animate-in slide-in-from-bottom duration-300 border-t border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 w-full text-center">Действия с отчетом</h2>
              <button onClick={() => setIsMobileActionsOpen(false)} className="absolute right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col py-2">
              {report.report_link && (
                <>
                  <button 
                    onClick={() => {
                      window.open(report.report_link, '_blank');
                      setIsMobileActionsOpen(false);
                    }} 
                    className="flex items-center gap-4 px-4 py-4 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer text-left w-full"
                  >
                    <FileText className="h-8 w-8 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900">Открыть PDF</div>
                      <div className="text-sm text-gray-500">Оригинальный документ отчета</div>
                    </div>
                  </button>
                  <div className="h-px bg-gray-100 mx-4" />
                </>
              )}
              <button 
                onClick={() => { setIsEditing(true); setIsMobileActionsOpen(false); }}
                disabled={isEditing}
                className={`flex items-center gap-4 px-4 py-4 transition-colors text-left w-full ${isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 active:bg-gray-200 cursor-pointer'}`}
              >
                <Edit className={`h-8 w-8 shrink-0 ${isEditing ? 'text-gray-400' : 'text-orange-500'}`} />
                <div>
                  <div className={`font-semibold ${isEditing ? 'text-gray-400' : 'text-gray-900'}`}>Изменить JSON</div>
                  <div className="text-sm text-gray-500">Редактировать содержимое отчета</div>
                </div>
              </button>
              <div className="h-px bg-gray-100 mx-4" />
              <button 
                onClick={() => { setIsDeleteModalOpen(true); setIsMobileActionsOpen(false); }}
                disabled={isDeleting || isEditing}
                className={`flex items-center gap-4 px-4 py-4 transition-colors text-left w-full ${isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 active:bg-red-100 cursor-pointer'}`}
              >
                <Trash2 className={`h-8 w-8 shrink-0 ${isEditing ? 'text-gray-400' : 'text-red-600'}`} />
                <div>
                  <div className={`font-semibold ${isEditing ? 'text-gray-400' : 'text-red-600'}`}>Удалить</div>
                  <div className="text-sm text-gray-500">Удалить отчет из системы</div>
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('reports-view-root')!
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          handleDelete();
        }}
        title="Удаление отчета"
      >
        <p>Вы уверены, что хотите удалить этот отчет? Это действие нельзя отменить.</p>
        {reportData?.general_info?.full_name && (
          <p className="mt-2 font-medium text-gray-900">Депутат: {reportData.general_info.full_name}</p>
        )}
      </ConfirmationModal>
    </Layout>
  );
};

export default ReportViewPage;
