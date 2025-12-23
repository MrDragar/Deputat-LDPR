import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { RegistrationForm } from '../../types';
import ApplicationFormDisplay from '../../components/application/ApplicationFormDisplay';

const MyProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.user_id) {
        setLoading(false);
        setError("Не удалось определить пользователя.");
        return;
    };

    const fetchMyForm = async () => {
      try {
        setLoading(true);
        // FIX: The API does not have a 'getFormByUserId' method.
        // The correct approach is to fetch the user by ID and then access their form.
        const data = await api.getUserById(user.user_id);
        if (data.deputyForm) {
            setForm(data.deputyForm);
            setError(null);
        } else {
            setError("Анкета для вашего пользователя не найдена.");
        }
      } catch (err) {
        setError('Не удалось загрузить данные анкеты.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyForm();
  }, [user]);

  if (loading) return <div className="p-6 text-center">Загрузка данных анкеты...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!form) return <div className="p-6 text-center">Анкета не найдена.</div>;

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Моя анкета</h1>
            <p className="mt-1 text-gray-500">Анкета от {new Date(form.createdAt).toLocaleDateString('ru-RU')}</p>
        </div>
      
        <ApplicationFormDisplay form={form} />
    </div>
  );
};

export default MyProfilePage;
