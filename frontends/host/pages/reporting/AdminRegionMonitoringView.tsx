import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { ReportPeriod, Report, ReportRecord, DeputyRecord, ReportTheme, DeputyLevel } from '../../types';
import { 
  ArrowLeft, MapPin, Users, Link as LinkIcon, 
  AlertCircle, Calendar, Inbox, Loader2, Plus, Trash2, X, UserX, UserCheck, ExternalLink, CheckCircle, Clock, Edit3
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import { useAlert } from '../../context/AlertContext';
import TextInput from '../../components/ui/TextInput';
import Switch from '../../components/ui/Switch';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { createPortal } from 'react-dom';
import RegionMonitoringDashboard from '../../components/reporting/RegionMonitoringDashboard';

const AdminRegionMonitoringView: React.FC = () => {
    const { regionReportId } = useParams<{ regionReportId: string }>();
    const { showAlert } = useAlert();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const isAdmin = user?.role === 'admin' || user?.role === 'employee';

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

    // State for Admin Check Modal
    const [isAdminCheckModalOpen, setIsAdminCheckModalOpen] = useState(false);
    const [targetReportRecord, setTargetReportRecord] = useState<ReportRecord | null>(null);
    const [checkScore, setCheckScore] = useState<string>('');
    const [checkExplanation, setCheckExplanation] = useState('');
    const [checkStatus, setCheckStatus] = useState<'waiting' | 'in_process' | 'processed'>('waiting');

    const [filteredCount, setFilteredCount] = useState(0);

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
            let fullDeputies = await Promise.all(deputyDetailsPromises);
            
            if (user?.role === 'deputy') {
                fullDeputies = fullDeputies.filter(d => Number(d.deputy) === Number(user.user_id));
            }
            
            setDeputyRecords(fullDeputies);
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось загрузить данные мониторинга.');
        } finally {
            setLoading(false);
        }
    }, [regionReportId, showAlert, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenAddModal = (level: DeputyLevel) => {
        if (!isAdmin) return;
        setAddModalLevel(level);
        setNewDeputyFio('');
        setNewDeputyAvailable(true);
        setNewDeputyReason('');
        setIsAddModalOpen(true);
    };

    const handleAddDeputy = async () => {
        if (!isAdmin || !regionReportId || !addModalLevel || !newDeputyFio.trim()) return;
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
        if (!isAdmin) return;
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
        if (!isAdmin) return;
        if (!deputy.isAvailable) {
            toggleStatus(deputy, true, null);
        } else {
            setTargetDeputy(deputy);
            setStatusReason('');
            setIsStatusModalOpen(true);
        }
    };

    const toggleStatus = async (deputy: DeputyRecord, available: boolean, reason: string | null) => {
        if (!isAdmin) return;
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

    const handleOpenAdminCheckModal = (record: ReportRecord) => {
        if (!isAdmin) return;
        setTargetReportRecord(record);
        setCheckScore(record.score !== null ? record.score.toString() : '');
        setCheckExplanation(record.scoreExplanation || '');
        setCheckStatus(record.status || 'waiting');
        setIsAdminCheckModalOpen(true);
    };

    const handleAdminCheckSubmit = async () => {
        if (!isAdmin || !targetReportRecord) return;
        
        const scoreNum = checkScore === '' ? null : parseFloat(checkScore);
        const newStatus = scoreNum !== null ? 'processed' : 'waiting';
        
        if (scoreNum !== null && scoreNum !== 0 && scoreNum !== 1) {
            showAlert('error', 'Ошибка валидации', 'Оценка должна быть 0 или 1.');
            return;
        }

        setIsSaving(true);
        try {
            const updatedRecord = await api.adminCheckReportRecord(targetReportRecord.id, {
                score: scoreNum,
                scoreExplanation: checkExplanation,
                status: newStatus
            });
            
            // Update the record in the state
            setDeputyRecords(prev => prev.map(deputy => {
                if (!deputy.reportRecords) return deputy;
                return {
                    ...deputy,
                    reportRecords: deputy.reportRecords.map(rr => 
                        rr.id === updatedRecord.id ? updatedRecord : rr
                    )
                };
            }));

            showAlert('success', 'Успешно', 'Результаты проверки сохранены.');
            setIsAdminCheckModalOpen(false);
        } catch (error: any) {
            const errorMsg = error.data?.score?.[0] || error.data?.detail || 'Не удалось сохранить результаты проверки.';
            showAlert('error', 'Ошибка', errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveLink = async (recordId: number, link: string | null) => {
        try {
            const result = await api.updateReportRecord(recordId, { link });
            setDeputyRecords(prev => prev.map(deputy => {
                if (!deputy.reportRecords) return deputy;
                return {
                    ...deputy,
                    reportRecords: deputy.reportRecords.map(rr => 
                        rr.id === result.id ? result : rr
                    )
                };
            }));
        } catch (error) {
            showAlert('error', 'Ошибка', 'Не удалось сохранить ссылку.');
            throw error;
        }
    };

    const allReportRecords = useMemo(() => {
        return deputyRecords.flatMap(d => d.reportRecords || []);
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
        <div className="max-w-full space-y-2 animate-in fade-in duration-500 pb-8 sm:pb-0 pt-4 sm:pt-0">
            <div className="px-4 sm:px-6">
                {isAdmin ? (
                    <Link to={`/reports/regions/${period.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={16} /> К списку регионов
                    </Link>
                ) : (
                    <Link to={`/reports`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft size={16} /> Назад к отчетам
                    </Link>
                )}
            </div>

            <RegionMonitoringDashboard
                period={period}
                periodId={period.id}
                deputies={deputyRecords}
                reports={period.reports || []}
                reportRecords={allReportRecords}
                isAdmin={isAdmin}
                isDeputy={user?.role === 'deputy'}
                onAddDeputy={isAdmin ? (level) => handleOpenAddModal(level as DeputyLevel) : undefined}
                onDeleteDeputy={isAdmin ? handleDeleteDeputy : undefined}
                onToggleStatus={isAdmin ? handleOpenStatusModal : undefined}
                onSaveLink={handleSaveLink}
                onAdminCheck={isAdmin ? handleOpenAdminCheckModal : () => {}}
                onFilteredCountChange={setFilteredCount}
                headerContent={
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                {user?.role === 'deputy' ? 'Моя отчётность' : 'Мониторинг региона'}
                                {user?.role !== 'deputy' && (
                                    <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">
                                        {filteredCount}
                                    </span>
                                )}
                            </h1>
                            <div className="mt-2 flex flex-col gap-1 text-sm">
                                <p className="text-gray-500">Регион: <span className="text-blue-600 font-bold">{regionName}</span></p>
                                <p className="text-gray-500">
                                    Период: <span className="font-bold text-gray-700 capitalize">{period.name || format(parseISO(period.startDate), 'LLLL yyyy', { locale: ru })}</span>
                                    <span className="ml-1 text-gray-400">({format(parseISO(period.startDate), 'd.MM.yyyy')} - {format(parseISO(period.endDate), 'd.MM.yyyy')})</span>
                                </p>
                            </div>
                        </div>
                    </div>
                }
            />

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
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold uppercase rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all"
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
            <ConfirmationModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onConfirm={() => toggleStatus(targetDeputy!, false, statusReason)}
                title="Изменить взаимодействие"
                confirmButtonText="Подтвердить"
                confirmButtonVariant="primary"
                isConfirmDisabled={isSaving || !statusReason.trim()}
                hideIcon={true}
                isSaving={isSaving}
            >
                <div className="text-left space-y-4 mt-4 min-h-[150px]">
                    <p className="text-sm text-gray-600">
                        Вы переводите депутата <b>{targetDeputy?.fio}</b> в статус невзаимодействующего. Он не будет обязан сдавать отчеты в этом периоде.
                    </p>
                    <div>
                        <label htmlFor="statusReason" className="block text-base font-semibold text-gray-800 mb-2">
                            Причина <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="statusReason"
                            name="statusReason"
                            className="w-full py-3 px-4 border rounded-lg shadow-sm bg-white/50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-base resize-none"
                            value={statusReason}
                            onChange={(e) => setStatusReason(e.target.value)}
                            placeholder="Укажите причину (болезнь, отпуск и т.д.)..."
                            rows={3}
                            required
                        />
                    </div>
                </div>
            </ConfirmationModal>

            {/* Admin Check Modal */}
            <ConfirmationModal
                isOpen={isAdminCheckModalOpen}
                onClose={() => setIsAdminCheckModalOpen(false)}
                onConfirm={() => {
                    setCheckStatus(checkScore === '' ? 'waiting' : 'processed');
                    handleAdminCheckSubmit();
                }}
                title="Проверка отчета"
                confirmButtonText="Сохранить"
                confirmButtonVariant="primary"
                isConfirmDisabled={isSaving || checkScore === ''}
                hideIcon={true}
                isSaving={isSaving}
            >
                <div className="text-left space-y-6 mt-4 min-h-[250px]">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800">Ссылка на отчет</label>
                        <a href={targetReportRecord?.link || '#'} target="_blank" rel="noopener noreferrer" className="block p-3 bg-blue-50 text-blue-600 rounded-lg text-sm hover:underline break-all border border-blue-100">
                            {targetReportRecord?.link}
                        </a>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-800">Оценка</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setCheckScore('0')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 text-base font-bold transition-all ${
                                    checkScore === '0' 
                                    ? 'border-red-500 bg-red-500 text-white shadow-sm' 
                                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                0 баллов
                            </button>
                            <button
                                type="button"
                                onClick={() => setCheckScore('1')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 text-base font-bold transition-all ${
                                    checkScore === '1' 
                                    ? 'border-green-500 bg-green-500 text-white shadow-sm' 
                                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                1 балл
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="scoreExplanation" className="block text-base font-semibold text-gray-800 mb-2">
                            Комментарий к оценке
                        </label>
                        <textarea
                            id="scoreExplanation"
                            name="scoreExplanation"
                            className="w-full py-3 px-4 border rounded-lg shadow-sm bg-white/50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-base resize-none"
                            value={checkExplanation}
                            onChange={(e) => setCheckExplanation(e.target.value)}
                            placeholder="Объяснение выставленной оценки..."
                            rows={3}
                        />
                    </div>
                </div>
            </ConfirmationModal>
        </div>
    );
};

export default AdminRegionMonitoringView;