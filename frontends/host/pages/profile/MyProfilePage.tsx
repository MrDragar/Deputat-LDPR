import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { RegistrationForm } from '../../types';
import ApplicationFormDisplay from '../../components/application/ApplicationFormDisplay';
import ApplicationDetailSkeleton from '../../components/skeletons/ApplicationDetailSkeleton';

const MyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.user_id) {
        setIsLoading(false);
        setError("Не удалось определить пользователя.");
        return;
    };

    const timer = setTimeout(() => {
        setShowSkeleton(true);
    }, 300);

    const fetchMyForm = async () => {
      try {
        const data = await api.getUserById(user.user_id);
        if (data.deputyForm) {
            setForm(data.deputyForm);
        } else {
            setError("Анкета для вашего пользователя не найдена.");
        }
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить данные анкеты.');
        console.error(err);
      } finally {
        clearTimeout(timer);
        setIsLoading(false);
      }
    };

    fetchMyForm();

    return () => clearTimeout(timer);
  }, [user]);

  if (isLoading) return showSkeleton ? <ApplicationDetailSkeleton /> : null;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!form) return <div className="p-6 text-center">Анкета не найдена.</div>;

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-white sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
            <div className="p-4 sm:p-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Моя анкета</h1>
                    <p className="mt-1 text-gray-500">Анкета от {new Date(form.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              
                <ApplicationFormDisplay form={form} />
            </div>
        </div>
    </div>
  );
};

export default MyProfilePage;