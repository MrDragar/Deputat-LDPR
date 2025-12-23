import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import type { RegistrationForm } from '../../types';
import ApplicationFormDisplay from '../../components/application/ApplicationFormDisplay';
import ApplicationDetailSkeleton from '../../components/skeletons/ApplicationDetailSkeleton';
import { ArrowLeft } from 'lucide-react';

const DeputyProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
        setIsLoading(false);
        setError("Не удалось определить ID пользователя.");
        return;
    };

    const timer = setTimeout(() => {
        setShowSkeleton(true);
    }, 300);

    const fetchDeputyForm = async () => {
      try {
        const userData = await api.getUserById(parseInt(userId, 10));
        if (userData.deputyForm) {
            setForm(userData.deputyForm);
        } else {
            setError('Анкета для данного пользователя не найдена.');
        }
      } catch (err) {
        setError('Не удалось загрузить данные анкеты.');
        console.error(err);
      } finally {
        clearTimeout(timer);
        setIsLoading(false);
      }
    };

    fetchDeputyForm();

    return () => clearTimeout(timer);
  }, [userId]);

  if (isLoading) return showSkeleton ? <ApplicationDetailSkeleton /> : null;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!form) return <div className="p-6 text-center">Анкета не найдена.</div>;
  
  const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.trim();

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-white sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
            <div className="p-4 sm:p-6">
                <Link to="/deputies" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors mb-6">
                    <ArrowLeft size={16} />
                    Вернуться к списку депутатов
                </Link>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Анкета: {fullName}</h1>
                    <p className="mt-1 text-gray-500">Дата подачи: {new Date(form.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              
                <ApplicationFormDisplay form={form} />
            </div>
        </div>
    </div>
  );
};

export default DeputyProfilePage;