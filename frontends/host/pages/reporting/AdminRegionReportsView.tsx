import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { ReportPeriod, RegionReport, Report, DeputyRecord, ReportTheme } from '../../types';
import { ArrowLeft, MapPin, ChevronRight, Inbox, Loader2, FileArchive, Search, ArrowUpDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { useAlert } from '../../context/AlertContext';
import JSZip from 'jszip';
import Select from '../../components/ui/Select';
import CheckboxDropdown from '../../components/ui/CheckboxDropdown';

const AdminRegionReportsView: React.FC = () => {
    const { periodId } = useParams<{ periodId: string }>();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const [period, setPeriod] = useState<ReportPeriod | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const STORAGE_KEY = `adminRegionFilters_${periodId}`;

    const [searchQuery, setSearchQuery] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { return JSON.parse(saved).searchQuery || ''; } catch (e) {}
        }
        return '';
    });
    const [selectedRegions, setSelectedRegions] = useState<string[]>(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { return JSON.parse(saved).selectedRegions || []; } catch (e) {}
        }
        return [];
    });
    const [isRegionsInitialized, setIsRegionsInitialized] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { return JSON.parse(saved).isRegionsInitialized || false; } catch (e) {}
        }
        return false;
    });
    const [sortOption, setSortOption] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { return JSON.parse(saved).sortOption || 'az'; } catch (e) {}
        }
        return 'az';
    });

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
            searchQuery,
            selectedRegions,
            isRegionsInitialized,
            sortOption
        }));
    }, [searchQuery, selectedRegions, isRegionsInitialized, sortOption, STORAGE_KEY]);

    const availableRegions = useMemo(() => {
        if (!period || !period.regionReports) return [];
        return Array.from(new Set(period.regionReports.map(r => r.regionName))).sort();
    }, [period]);

    useEffect(() => {
        if (!isRegionsInitialized && availableRegions.length > 0) {
            setSelectedRegions(availableRegions);
            setIsRegionsInitialized(true);
        }
    }, [availableRegions, isRegionsInitialized]);

    const filteredRegions = useMemo(() => {
        if (!period || !period.regionReports) return [];
        
        if (isRegionsInitialized && selectedRegions.length === 0) {
            return [];
        }

        let filtered = [...period.regionReports];

        if (searchQuery) {
            filtered = filtered.filter(r => r.regionName.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (selectedRegions.length > 0) {
            filtered = filtered.filter(r => selectedRegions.includes(r.regionName));
        }

        switch (sortOption) {
            case 'az':
            default:
                filtered.sort((a, b) => a.regionName.localeCompare(b.regionName));
                break;
            case 'za':
                filtered.sort((a, b) => b.regionName.localeCompare(a.regionName));
                break;
        }

        return filtered;
    }, [period, searchQuery, selectedRegions, sortOption]);

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
        <div className="space-y-2 animate-in fade-in duration-500 pb-8 sm:pb-0 pt-4 sm:pt-0">
            <div className="px-4 sm:px-6">
                <Link to="/reports" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                    <ArrowLeft size={16} /> Назад к периодам
                </Link>
            </div>

            <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200 sm:shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">Регионы</h1>
                            <span className="bg-blue-600 text-white font-semibold px-3 py-1 text-sm rounded-full">
                                {filteredRegions.length}
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <p>
                                Период: <span className="font-bold text-gray-700 capitalize">{periodName}</span>
                                <span className="ml-1 text-gray-400">({format(parseISO(period.startDate), 'd.MM.yyyy')} - {format(parseISO(period.endDate), 'd.MM.yyyy')})</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={handleDownloadAll}
                        disabled={isExporting || !period.regionReports || period.regionReports.length === 0}
                        className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-300 disabled:shadow-none"
                    >
                        {isExporting ? <Loader2 size={20} className="animate-spin" /> : <FileArchive size={20} />}
                        <span className="ml-2">{isExporting ? 'Сбор данных...' : 'Экспортировать'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Поиск по региону..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-[50px] pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
                        />
                    </div>
                    
                    {/* Region Dropdown */}
                    <div>
                        <CheckboxDropdown
                            title=""
                            options={availableRegions}
                            selectedOptions={selectedRegions}
                            onChange={setSelectedRegions}
                            placeholder="Регион"
                        />
                    </div>

                    {/* Sort Dropdown */}
                    <div>
                        <Select
                            value={sortOption}
                            onChange={(_, val) => setSortOption(val)}
                            options={[
                                { value: 'az', label: 'По названию (А-Я)' },
                                { value: 'za', label: 'По названию (Я-А)' }
                            ]}
                            icon={<ArrowUpDown className="h-5 w-5 text-gray-400" />}
                            className="h-[50px]"
                        />
                    </div>
                </div>
            </div>

            {!period.regionReports || period.regionReports.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                    <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">Регионы не найдены</h3>
                    <p className="text-gray-500">В этом периоде еще не создано ни одного регионального отчета.</p>
                </div>
            ) : filteredRegions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">Ничего не найдено</h3>
                    <p className="text-gray-500">По вашему запросу не найдено ни одного региона.</p>
                </div>
            ) : (
                <div className="bg-white sm:rounded-xl sm:border border-gray-200 sm:shadow-sm overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                        {filteredRegions.map((reg, index) => (
                            <li key={reg.id}>
                                <button 
                                    onClick={() => navigate(`/reports/monitoring/${reg.id}`)}
                                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                            {reg.regionName}
                                        </span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-300 ml-2 flex-shrink-0 group-hover:text-blue-600 transition-colors" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AdminRegionReportsView;