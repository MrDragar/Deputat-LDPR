// components/SubmissionStatus.tsx
import React from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface SubmissionStatusProps {
  isSubmitting: boolean;
  error: string | null;
  onRetry?: () => void;
}

// components/SubmissionStatus.tsx - добавляем статус создания PDF
const SubmissionStatus: React.FC<SubmissionStatusProps> = ({ 
  isSubmitting, 
  error, 
  onRetry 
}) => {
  if (isSubmitting) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Создание PDF отчёта</h3>
          <p className="text-gray-600">Пожалуйста, подождите, идёт генерация файла...</p>
          <p className="text-gray-500 text-sm mt-2">Файл начнёт скачиваться автоматически</p>
        </div>
      </div>
    );
  }
  return null;
};

export default SubmissionStatus;