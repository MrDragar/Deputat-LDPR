import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { ReportPeriod, RegionReport, Report, DeputyRecord, ReportTheme } from '../../types';
import { ArrowLeft, MapPin, ChevronRight, Inbox, Loader2, FileArchive } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { useAlert } from '../../context/AlertContext';
import JSZip from 'jszip';

const AdminRegionReportsView: React.FC = () => {
    const { periodId } = useParams<{ periodId: string }>();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [period, setPeriod] = useState<ReportPeriod | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!periodId) return;
        try {
            setLoading(true);
            const data = await api.getReportPeriodById(Number(periodId));
            setPeriod(data);
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось загрузить регионы периода.');
        } finally {
            setLoading(false);
        }
    }, [periodId, showAlert]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDownloadAll = async () => {
        if (!period || !period.regionReports || period.regionReports.length === 0) return;
        
        setIsExporting(true);
        showAlert('success', 'Экспорт запущен', 'Собираем данные по всем регионам. Это может занять время...');

        try {
            const zip = new JSZip();
            
            // 1. Определяем порядок отчетов (слотов) в периоде для нумерации
            const allReports = period.reports || [];
            const sortReports = (a: Report, b: Report) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime() || a.id - b.id;
            
            const infoudarTemplates = allReports.filter(r => r.theme === 'infoudar').sort(sortReports);
            const vdpgTemplates = allReports.filter(r => r.theme === 'vdpg').sort(sortReports);
            const eventTemplates = allReports.filter(r => ['event', 'reg_event'].includes(r.theme)).sort(sortReports);
            const optionalTemplates = allReports.filter(r => r.theme === 'opt_event').sort(sortReports);

            // 2. Обрабатываем каждый регион
            for (const regionSummary of period.regionReports) {
                const regionDetail = await api.getRegionReportById(regionSummary.id);
                const deputiesSummary = regionDetail.deputiesRecords || [];
                
                // Загружаем полные данные всех депутатов региона (с ссылками)
                const fullDeputiesPromises = deputiesSummary.map(d => api.getDeputyRecordById(d.id));
                const fullDeputies = await Promise.all(fullDeputiesPromises);

                // Собираем телефоны, если есть привязка к пользователю
                const deputyUsersIds = [...new Set(fullDeputies.map(d => d.deputy).filter(id => id !== null))] as number[];
                const userProfilesMap: Record<number, string> = {};
                
                await Promise.all(deputyUsersIds.map(async (uid) => {
                    try {
                        const u = await api.getUserById(uid);
                        if (u.deputyForm?.phone) {
                            userProfilesMap[uid] = u.deputyForm.phone.replace(/\D/g, '');
                        }
                    } catch (e) {
                        console.warn(`Could not fetch profile for user ${uid}`);
                    }
                }));

                const transformDeputy = (d: DeputyRecord) => {
                    const vdpgMap: Record<string, string | null> = {};
                    vdpgTemplates.forEach((t, i) => {
                        const rec = d.reportRecords?.find(rr => rr.report === t.id);
                        vdpgMap[`vdpg_${i + 1}`] = rec?.link || null;
                    });

                    const postsMap: Record<string, string | null> = {};
                    infoudarTemplates.forEach((t, i) => {
                        const rec = d.reportRecords?.find(rr => rr.report === t.id);
                        postsMap[`post_${i + 1}`] = rec?.link || null;
                    });

                    const eventsMap: Record<string, any> = {};
                    eventTemplates.forEach((t, i) => {
                        const rec = d.reportRecords?.find(rr => rr.report === t.id);
                        eventsMap[`${i + 1}`] = rec?.link || null;
                    });
                    eventsMap["опционально"] = optionalTemplates.map(t => {
                        const rec = d.reportRecords?.find(rr => rr.report === t.id);
                        return rec?.link || null;
                    });

                    return {
                        id: d.id,
                        deputy: d.deputy,
                        fio: d.fio,
                        is_available: d.isAvailable,
                        reason: d.reason || "",
                        "ВДПГ": vdpgMap,
                        contact: d.deputy ? parseInt(userProfilesMap[d.deputy] || "0", 10) || null : null,
                        "Посты по информационным ударам": postsMap,
                        "Мероприятия по взаимодействию с избирателями, отраслевыми экспертными сообществами (в т.ч. по отработке ключевых информационных поводов)": eventsMap
                    };
                };

                const jsonData = {
                    "Депутаты муниципальных образований": fullDeputies.filter(d => d.level === 'МСУ').map(transformDeputy),
                    "Депутаты административных центров регионов": fullDeputies.filter(d => d.level === 'АЦС').map(transformDeputy),
                    "Депутаты Законодательных собраний регионов": fullDeputies.filter(d => d.level === 'ЗС').map(transformDeputy),
                    "region": regionSummary.regionName
                };

                zip.file(`${regionSummary.regionName.replace(/[\/\\?%*:|"<>]/g, '-')}.json`, JSON.stringify(jsonData, null, 4));
            }

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `data_export_period_${period.id}_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showAlert('success', 'Готово', 'Архив с данными успешно сформирован и скачан.');
        } catch (error) {
            console.error(error);
            showAlert('error', 'Ошибка экспорта', 'Произошла ошибка при сборке данных.');
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
                <p className="text-gray-500 font-medium">Загрузка регионов...</p>
            </div>
        );
    }

    if (!period) return null;

    const periodName = period.name || format(parseISO(period.startDate), 'LLLL yyyy', { locale: ru });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header>
                <Link to="/reports" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mb-4">
                    <ArrowLeft size={16} /> Назад к периодам
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Регионы периода</h1>
                        <p className="mt-1 text-gray-500 capitalize">{periodName}</p>
                    </div>
                    <button 
                        onClick={handleDownloadAll}
                        disabled={isExporting || !period.regionReports || period.regionReports.length === 0}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all disabled:bg-blue-300 disabled:shadow-none"
                    >
                        {isExporting ? <Loader2 size={20} className="animate-spin" /> : <FileArchive size={20} />}
                        <span>{isExporting ? 'Сбор данных...' : 'Скачать данные'}</span>
                    </button>
                </div>
            </header>

            {!period.regionReports || period.regionReports.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                    <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">Регионы не найдены</h3>
                    <p className="text-gray-500">В этом периоде еще не создано ни одного регионального отчета.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {period.regionReports.map((reg) => (
                        <div key={reg.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <MapPin size={24} />
                                    </div>
                                    <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded-md">ID: {reg.id}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-6 line-clamp-2 min-h-[3.5rem]">{reg.regionName}</h3>
                                <button 
                                    onClick={() => navigate(`/reports/monitoring/${reg.id}`)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 rounded-lg font-bold hover:bg-blue-50 hover:text-blue-700 transition-all border border-slate-200 hover:border-blue-200"
                                >
                                    Детализация <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminRegionReportsView;