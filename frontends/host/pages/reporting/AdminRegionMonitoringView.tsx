import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { ReportPeriod, Report, ReportRecord, DeputyRecord, ReportTheme, DeputyLevel } from '../../types';
import { 
  ArrowLeft, MapPin, Users, Link as LinkIcon, 
  AlertCircle, Calendar, Inbox, Loader2, Plus, Trash2, X, ShieldAlert, ShieldCheck, ExternalLink
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { useAlert } from '../../context/AlertContext';
import TextInput from '../../components/ui/TextInput';
import Switch from '../../components/ui/Switch';
import { createPortal } from 'react-dom';

const THEME_ORDER: Record<ReportTheme, number> = {
    'infoudar': 1,
    'event': 2,
    'reg_event': 3,
    'opt_event': 4,
    'vdpg': 5,
    'letter': 6
};

const GET_GROUP_INFO = (theme: ReportTheme) => {
    if (theme === 'infoudar') return { title: 'Инфоудары', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (['event', 'reg_event', 'opt_event'].includes(theme)) return { title: 'Мероприятия', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (theme === 'vdpg') return { title: 'ВДПГ', color: 'bg-red-50 text-red-700 border-red-200' };
    return { title: 'Прочее', color: 'bg-gray-50 text-gray-700 border-gray-200' };
};

const AdminRegionMonitoringView: React.FC = () => {
    const { regionReportId } = useParams<{ regionReportId: string }>();
    const { showAlert } = useAlert();
    
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<ReportPeriod | null>(null);
    const [regionName, setRegionName] = useState('');
    const [deputyRecords, setDeputyRecords] = useState<DeputyRecord[]>([]);

    // State for Add Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalLevel, setAddModalLevel] = useState<DeputyLevel | null>(null);
    const [newDeputyFio, setNewDeputyFio] = useState('');
    const [newDeputyAvailable, setNewDeputyAvailable] = useState(true);
    const [newDeputyReason, setNewDeputyReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // State for Status Toggle Modal
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [targetDeputy, setTargetDeputy] = useState<DeputyRecord | null>(null);
    const [statusReason, setStatusReason] = useState('');

    const fetchData = useCallback(async () => {
        if (!regionReportId) return;
        try {
            setLoading(true);
            const regionDetail = await api.getRegionReportById(Number(regionReportId));
            setRegionName(regionDetail.regionName);
            
            const periodDetail = await api.getReportPeriodById(regionDetail.reportPeriod);
            setPeriod(periodDetail);

            const deputySummaries = regionDetail.deputiesRecords || [];
            const deputyDetailsPromises = deputySummaries.map(ds => api.getDeputyRecordById(ds.id));
            const fullDeputies = await Promise.all(deputyDetailsPromises);
            
            setDeputyRecords(fullDeputies);
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось загрузить данные мониторинга.');
        } finally {
            setLoading(false);
        }
    }, [regionReportId, showAlert]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenAddModal = (level: DeputyLevel) => {
        setAddModalLevel(level);
        setNewDeputyFio('');
        setNewDeputyAvailable(true);
        setNewDeputyReason('');
        setIsAddModalOpen(true);
    };

    const handleAddDeputy = async () => {
        if (!regionReportId || !addModalLevel || !newDeputyFio.trim()) return;
        setIsSaving(true);
        try {
            const created = await api.createDeputyRecord({
                regionReport: Number(regionReportId),
                fio: newDeputyFio.trim(),
                level: addModalLevel,
                isAvailable: newDeputyAvailable,
                reason: newDeputyAvailable ? null : newDeputyReason.trim(),
                deputy: null 
            });
            
            // Получаем полные данные новой записи (включая пустые слоты отчетов)
            const fullNewRecord = await api.getDeputyRecordById(created.id);
            
            // Динамически обновляем стейт без перезагрузки
            setDeputyRecords(prev => [...prev, fullNewRecord]);
            
            showAlert('success', 'Готово', 'Запись депутата добавлена.');
            setIsAddModalOpen(false);
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось добавить запись.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteDeputy = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        e.preventDefault();
        if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
        
        try {
            await api.deleteDeputyRecord(id);
            // Динамически обновляем стейт
            setDeputyRecords(prev => prev.filter(d => d.id !== id));
            showAlert('success', 'Удалено', 'Запись депутата удалена.');
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось удалить запись.');
        }
    };

    const handleOpenStatusModal = (deputy: DeputyRecord) => {
        if (!deputy.isAvailable) {
            toggleStatus(deputy, true, null);
        } else {
            setTargetDeputy(deputy);
            setStatusReason('');
            setIsStatusModalOpen(true);
        }
    };

    const toggleStatus = async (deputy: DeputyRecord, available: boolean, reason: string | null) => {
        setIsSaving(true);
        try {
            const updated = await api.updateDeputyRecord(deputy.id, {
                isAvailable: available,
                reason: reason
            });
            
            // Динамически обновляем конкретный объект в стейте
            setDeputyRecords(prev => prev.map(d => d.id === deputy.id ? { 
                ...d, 
                isAvailable: updated.isAvailable, 
                reason: updated.reason 
            } : d));

            showAlert('success', 'Обновлено', available ? 'Депутат теперь обязан сдавать отчеты.' : 'Депутат переведен в статус невзаимодействующего.');
            setIsStatusModalOpen(false);
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось обновить статус депутата.');
        } finally {
            setIsSaving(false);
        }
    };

    // Общая функция сортировки записей
    const sortDeputies = (a: DeputyRecord, b: DeputyRecord) => {
        // 1. Сначала взаимодействующие (isAvailable: true)
        if (a.isAvailable !== b.isAvailable) {
            return a.isAvailable ? -1 : 1;
        }
        // 2. Сначала те, у кого есть привязка к пользователю (deputy != null)
        const aHasUser = a.deputy !== null;
        const bHasUser = b.deputy !== null;
        if (aHasUser !== bHasUser) {
            return aHasUser ? -1 : 1;
        }
        // 3. По ФИО (А-Я)
        return a.fio.localeCompare(b.fio);
    };

    const renderLevelTable = (levelLabel: string, levelCode: DeputyLevel, deputies: DeputyRecord[], reports: Report[], isZS: boolean) => {
        const sortedReports = [...reports]
            .filter(r => isZS || r.theme !== 'reg_event')
            .sort((a, b) => (THEME_ORDER[a.theme] || 99) - (THEME_ORDER[b.theme] || 99));

        const groups: { title: string, color: string, count: number }[] = [];
        sortedReports.forEach((report) => {
            const info = GET_GROUP_INFO(report.theme);
            if (groups.length > 0 && groups[groups.length - 1].title === info.title) {
                groups[groups.length - 1].count++;
            } else {
                groups.push({ ...info, count: 1 });
            }
        });

        // Применяем сортировку к списку депутатов перед рендером
        const sortedDeputies = [...deputies].sort(sortDeputies);

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{levelLabel}</h4>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{deputies.length}</span>
                    </div>
                    <button 
                        onClick={() => handleOpenAddModal(levelCode)}
                        className="flex items-center gap-1 text-[11px] font-bold uppercase text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                    >
                        <Plus size={12} /> Добавить запись
                    </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-auto max-h-[700px] relative">
                    <table className="w-full min-w-[800px] text-sm text-left border-collapse table-auto">
                        <thead className="sticky top-0 z-30">
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th rowSpan={2} scope="col" className="px-6 py-3 font-bold sticky left-0 bg-gray-50 z-40 w-[250px] border-r border-gray-200">
                                    Депутат
                                </th>
                                {groups.map((group, idx) => (
                                    <th 
                                        key={`${group.title}-${idx}`} 
                                        colSpan={group.count} 
                                        className={`px-3 py-2 text-center text-[10px] font-extrabold uppercase tracking-widest border-b border-gray-200 ${group.color} ${idx > 0 ? 'border-l-2 border-gray-300' : 'border-l border-gray-200'}`}
                                    >
                                        {group.title}
                                    </th>
                                ))}
                            </tr>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {sortedReports.map((report, idx) => {
                                    const isSpecial = ['infoudar', 'vdpg'].includes(report.theme);
                                    const groupInfo = GET_GROUP_INFO(report.theme);
                                    const isFirstInGroup = idx === 0 || GET_GROUP_INFO(sortedReports[idx-1].theme).title !== groupInfo.title;

                                    return (
                                        <th 
                                            key={report.id} 
                                            scope="col" 
                                            className={`px-3 py-3 font-bold text-center min-w-[160px] bg-gray-50/80 backdrop-blur-sm ${isFirstInGroup && idx > 0 ? 'border-l-2 border-gray-300' : 'border-l border-gray-100'}`}
                                        >
                                            <div className="flex flex-col items-center gap-0.5">
                                                {isSpecial ? (
                                                    <>
                                                        <span className="text-gray-400 text-[8px] font-bold uppercase mb-0.5">
                                                            {format(parseISO(report.startDate), 'dd.MM')} — {format(parseISO(report.endDate), 'dd.MM')}
                                                        </span>
                                                        <span className="text-gray-900 leading-tight normal-case text-[11px] font-bold line-clamp-2 px-1 text-center">
                                                            {report.name}
                                                        </span>
                                                        {report.description && (
                                                            <span className="text-gray-400 text-[9px] font-normal leading-tight mt-1 line-clamp-2 px-1 italic">
                                                                {report.description}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-gray-900 leading-tight text-center text-[11px]">{report.themeDisplay}</span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedDeputies.map(deputy => (
                                <tr key={deputy.id} className="hover:bg-blue-50/20 transition-colors">
                                    <th scope="row" className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-10 border-r border-gray-100">
                                        <div className="flex flex-col min-w-0 text-left">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-sm truncate ${!deputy.isAvailable ? 'text-gray-400 line-through' : ''}`}>{deputy.fio}</span>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => handleOpenStatusModal(deputy)}
                                                        className={`p-1 rounded transition-all hover:scale-110 ${deputy.isAvailable ? 'text-green-500 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                                                        title={deputy.isAvailable ? "Сделать невзаимодействующим" : "Сделать обязанным сдавать отчеты"}
                                                    >
                                                        {deputy.isAvailable ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                                                    </button>
                                                    {deputy.deputy === null && (
                                                        <button 
                                                            onClick={(e) => handleDeleteDeputy(e, deputy.id)}
                                                            className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                            title="Удалить запись"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {!deputy.isAvailable && deputy.reason && (
                                                <span className="text-[10px] text-red-500 font-bold leading-tight italic bg-red-50 px-1.5 py-0.5 rounded-sm whitespace-normal max-w-[200px]">
                                                    Причина: {deputy.reason}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                    {deputy.isAvailable ? (
                                        sortedReports.map((report, idx) => {
                                            const subs = (deputy.reportRecords || []).filter(rr => rr.report === report.id);
                                            const isNumbered = ['event', 'opt_event', 'reg_event'].includes(report.theme);
                                            const groupInfo = GET_GROUP_INFO(report.theme);
                                            const isFirstInGroup = idx === 0 || GET_GROUP_INFO(sortedReports[idx-1].theme).title !== groupInfo.title;

                                            return (
                                                <td key={`${deputy.id}-${report.id}`} className={`px-2 py-3 text-center ${isFirstInGroup && idx > 0 ? 'border-l-2 border-gray-200 bg-slate-50/30' : 'border-l border-gray-100'}`}>
                                                    <div className="flex flex-col gap-1.5 items-center">
                                                        {subs.length > 0 ? subs.map((sub, sIdx) => (
                                                            <div key={sub.id} className="w-full max-w-[140px]">
                                                                {sub.link ? (
                                                                    <a 
                                                                        href={sub.link} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold hover:bg-green-100 transition-colors border border-green-200"
                                                                        title={sub.link}
                                                                    >
                                                                        <ExternalLink size={10} className="shrink-0" /> 
                                                                        <span className="truncate">{isNumbered && subs.length > 1 ? `№${sIdx + 1}: ` : ''}{sub.link.replace(/^https?:\/\//, '')}</span>
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-[10px] text-gray-300 uppercase font-bold tracking-tighter">Не сдан</span>
                                                                )}
                                                            </div>
                                                        )) : (
                                                            <span className="text-[10px] text-gray-300">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })
                                    ) : (
                                        <td colSpan={sortedReports.length} className="px-6 py-4 bg-gray-50/50 text-center">
                                            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-widest">
                                                Отчеты не требуются
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const groupedDeputies = useMemo(() => {
        const zs = deputyRecords.filter(d => 
            d.level === 'ЗС' || 
            (d.levelDisplay || '').includes('ЗС') || 
            (d.levelDisplay || '').includes('Законодательн')
        );
        const acr = deputyRecords.filter(d => 
            d.level === 'АЦС' || 
            (d.levelDisplay || '').includes('АЦС') || 
            (d.levelDisplay || '').includes('административн')
        );
        const mcu = deputyRecords.filter(d => 
            d.level === 'МСУ' || 
            (d.levelDisplay || '').includes('МСУ') || 
            (d.levelDisplay || '').includes('муниципальн')
        );

        const handledIds = new Set([...zs, ...acr, ...mcu].map(d => d.id));
        const others = deputyRecords.filter(d => !handledIds.has(d.id));

        return { zs, acr, mcu, others };
    }, [deputyRecords]);

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
                <p className="text-gray-500 font-medium">Сбор данных по депутатам региона...</p>
            </div>
        );
    }

    if (!period) return null;

    const portalRoot = document.getElementById('root');

    return (
        <div className="max-w-full space-y-6 animate-in fade-in duration-500">
            <header>
                <Link to={`/reports/regions/${period.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors mb-4">
                    <ArrowLeft size={16} /> К списку регионов
                </Link>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Мониторинг региона</h1>
                        <p className="mt-1 text-gray-500">Регион: <span className="text-blue-600 font-bold">{regionName}</span></p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                         <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-xs font-bold mb-1">
                            <Calendar size={14} /> Период: {period.name}
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Всего депутатов: {deputyRecords.length}</p>
                    </div>
                </div>
            </header>

            <div className="space-y-8">
                {renderLevelTable('Законодательное Собрание (ЗС)', 'ЗС', groupedDeputies.zs, period.reports || [], true)}
                {renderLevelTable('Административный Центр (АЦС)', 'АЦС', groupedDeputies.acr, period.reports || [], false)}
                {renderLevelTable('Местное Самоуправление (МСУ)', 'МСУ', groupedDeputies.mcu, period.reports || [], false)}
                {groupedDeputies.others.length > 0 && renderLevelTable('Другие уровни', 'МСУ', groupedDeputies.others, period.reports || [], false)}
            </div>

            {/* Add Deputy Record Modal */}
            {isAddModalOpen && portalRoot && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <header className="flex items-center justify-between p-4 sm:p-6 border-b bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Users size={20} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Добавить запись ({addModalLevel})</h2>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </header>
                        <div className="p-4 sm:p-6 space-y-6">
                            <TextInput 
                                label="ФИО депутата" 
                                name="fio" 
                                value={newDeputyFio} 
                                onChange={(_, val) => setNewDeputyFio(val)} 
                                placeholder="Фамилия Имя Отчество"
                                required
                            />
                            
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                <Switch 
                                    id="available-toggle" 
                                    label="Обязан сдавать отчеты" 
                                    checked={newDeputyAvailable} 
                                    onChange={setNewDeputyAvailable} 
                                />
                                
                                {!newDeputyAvailable && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <TextInput 
                                            label="Причина отсутствия отчетов" 
                                            name="reason" 
                                            type="textarea"
                                            value={newDeputyReason} 
                                            onChange={(_, val) => setNewDeputyReason(val)} 
                                            placeholder="Например: в отпуске, болезнь, сложил полномочия..."
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <footer className="flex justify-end gap-3 p-4 sm:p-6 bg-gray-50 border-t">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Отмена</button>
                            <button 
                                onClick={handleAddDeputy} 
                                disabled={isSaving || !newDeputyFio.trim() || (!newDeputyAvailable && !newDeputyReason.trim())}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold uppercase rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 transition-all"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Сохранить
                            </button>
                        </footer>
                    </div>
                </div>,
                portalRoot
            )}

            {/* Change Status Reason Modal */}
            {isStatusModalOpen && targetDeputy && portalRoot && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <header className="flex items-center justify-between p-4 border-b bg-orange-50">
                            <h2 className="text-lg font-bold text-orange-800">Статус: Невзаимодействующий</h2>
                            <button onClick={() => setIsStatusModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </header>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">Вы переводите депутата <b>{targetDeputy.fio}</b> в статус невзаимодействующего. Он не будет обязан сдавать отчеты в этом периоде.</p>
                            <TextInput 
                                label="Причина" 
                                name="statusReason" 
                                type="textarea"
                                value={statusReason} 
                                onChange={(_, val) => setStatusReason(val)} 
                                placeholder="Укажите причину (болезнь, отпуск и т.д.)..."
                                required
                            />
                        </div>
                        <footer className="flex justify-end gap-3 p-4 bg-gray-50 border-t">
                            <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Отмена</button>
                            <button 
                                onClick={() => toggleStatus(targetDeputy, false, statusReason)} 
                                disabled={isSaving || !statusReason.trim()}
                                className="px-4 py-2 bg-orange-600 text-white text-sm font-bold uppercase rounded-lg shadow-md hover:bg-orange-700 disabled:bg-orange-300 transition-all"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Подтвердить'}
                            </button>
                        </footer>
                    </div>
                </div>,
                portalRoot
            )}
        </div>
    );
};

export default AdminRegionMonitoringView;