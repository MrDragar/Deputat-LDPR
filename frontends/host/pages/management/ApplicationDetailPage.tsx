import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { RegistrationForm } from '../../types';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import TextInput from '../../components/ui/TextInput';
import ApplicationFormDisplay from '../../components/application/ApplicationFormDisplay';
import { ArrowLeft } from 'lucide-react';
import ApplicationDetailSkeleton from '../../components/skeletons/ApplicationDetailSkeleton';

const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!id) {
        setIsLoading(false);
        return;
    };
    
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, 300);

    const fetchForm = async () => {
      try {
        const data = await api.getFormById(id);
        setForm(data);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить данные анкеты.');
        console.error(err);
      } finally {
        clearTimeout(timer);
        setIsLoading(false);
      }
    };
    fetchForm();

    return () => clearTimeout(timer);
  }, [id]);

  const handleProcess = useCallback(async (status: boolean, message: string) => {
    if (!form?.user) return;
    setProcessing(true);
    try {
      await api.processForm(form.user, status, message);
      navigate('/applications');
    } catch (err) {
      setError('Ошибка при обработке анкеты.');
      console.error(err);
    } finally {
      setProcessing(false);
      setIsRejectModalOpen(false);
      setIsApproveModalOpen(false);
    }
  }, [form, navigate]);
  
  const handleApprove = useCallback(() => handleProcess(true, 'Анкета одобрена'), [handleProcess]);
  const handleReject = useCallback(() => { if (rejectionReason.trim()) handleProcess(false, rejectionReason); }, [rejectionReason, handleProcess]);
  
  const handleRejectionReasonChange = useCallback((_: string, val: string) => {
    setRejectionReason(val);
  }, []);

  const openRejectModal = useCallback(() => setIsRejectModalOpen(true), []);
  const closeRejectModal = useCallback(() => setIsRejectModalOpen(false), []);
  const openApproveModal = useCallback(() => setIsApproveModalOpen(true), []);
  const closeApproveModal = useCallback(() => setIsApproveModalOpen(false), []);

  if (isLoading) return showSkeleton ? <ApplicationDetailSkeleton /> : null;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!form) return <div className="p-6 text-center">Анкета не найдена.</div>;
  
  const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.trim();

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-white sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
            <div className="p-4 sm:p-6">
                <Link to="/applications" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors mb-6">
                    <ArrowLeft size={16} />
                    Вернуться к списку заявок
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                        <p className="mt-1 text-gray-500">Анкета кандидата от {new Date(form.createdAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <button onClick={openRejectModal} disabled={processing} className="px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Отклонить
                        </button>
                        <button onClick={openApproveModal} disabled={processing} className="px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        {processing ? 'Обработка...' : 'Одобрить'}
                        </button>
                    </div>
                </div>
                
                <ApplicationFormDisplay form={form} />
            </div>
        </div>

        <ConfirmationModal
            isOpen={isRejectModalOpen}
            onClose={closeRejectModal}
            onConfirm={handleReject}
            title="Отклонить заявку?"
            confirmButtonVariant="danger"
            confirmButtonText="Отклонить"
        >
            <p className="mb-4">Пожалуйста, укажите причину отклонения заявки. Это сообщение будет отправлено кандидату.</p>
            <TextInput 
              name="rejectionReason"
              type="textarea"
              value={rejectionReason}
              onChange={handleRejectionReasonChange}
              placeholder="Причина отклонения..."
              required
            />
        </ConfirmationModal>
        
        <ConfirmationModal
            isOpen={isApproveModalOpen}
            onClose={closeApproveModal}
            onConfirm={handleApprove}
            title="Одобрить заявку?"
            confirmButtonVariant="success"
            confirmButtonText="Одобрить"
        >
            <p className="mb-4 text-sm">Вы уверены, что хотите одобрить анкету кандидата? Пожалуйста, проверьте данные перед подтверждением.</p>
            <div className="border rounded-lg bg-slate-50 text-sm text-left overflow-hidden">
                <div className="p-3 border-b border-slate-200">
                    <p className="text-xs font-medium text-gray-500">ФИО</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{fullName}</p>
                </div>
                 <div className="p-3 border-b border-slate-200">
                    <p className="text-xs font-medium text-gray-500">Регион</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{form.region}</p>
                </div>
                <div className="p-3 border-b border-slate-200">
                    <p className="text-xs font-medium text-gray-500">Должность в рег. отделении</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{form.partyRole || '—'}</p>
                </div>
                <div className="p-3">
                    <p className="text-xs font-medium text-gray-500">Уровень представительного органа</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{form.representativeBodyLevel || '—'}</p>
                </div>
            </div>
        </ConfirmationModal>
    </div>
  );
};

export default ApplicationDetailPage;