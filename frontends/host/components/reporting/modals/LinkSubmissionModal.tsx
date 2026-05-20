import React, { useState, useEffect } from 'react';
import { X, Loader2, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import type { Report, ReportRecord, DeputyRecord } from '../../../types';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface LinkSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report;
  record: ReportRecord;
  deputy: DeputyRecord;
  onSave: (recordId: number, link: string | null) => Promise<void>;
}

export default function LinkSubmissionModal({
  isOpen,
  onClose,
  report,
  record,
  deputy,
  onSave
}: LinkSubmissionModalProps) {
  const [link, setLink] = useState(record.link || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLink(record.link || '');
      setError('');
    }
  }, [isOpen, record.link]);

  if (!isOpen) return null;

  const validateLink = (url: string) => {
    url = url.trim();
    if (!url) return { valid: false, error: 'Пожалуйста, введите ссылку' };
    
    const lowerUrl = url.toLowerCase();
    const isVk = lowerUrl.includes('vk.com') || lowerUrl.includes('vk.ru');
    const vkExample = ' Пример: https://vk.com/wall-123456_7890';

    if (url.includes(' ')) {
        return { valid: false, error: `Ссылка не должна содержать пробелы.${isVk ? vkExample : ''}` };
    }

    const httpCount = (url.match(/https?:\/\//g) || []).length;
    if (httpCount > 1) {
        return { valid: false, error: `Пожалуйста, введите только одну ссылку.${isVk ? vkExample : ''}` };
    }

    try {
      new URL(url);
    } catch {
      return { valid: false, error: `Пожалуйста, введите корректную ссылку (начиная с http:// или https://).${isVk ? vkExample : ''}` };
    }

    if (isVk) {
        if (!/wall(-?\d+)_(\d+)/.test(url)) {
            return { valid: false, error: `Неверный формат ссылки ВКонтакте.${vkExample}` };
        }
    } else if (lowerUrl.includes('t.me')) {
        const tgRegex = /^https?:\/\/t\.me\/[a-zA-Z0-9_]+\/\d+(\?single)?$/;
        if (!tgRegex.test(url)) {
            return { valid: false, error: 'Неверный формат ссылки Telegram. Пример: https://t.me/username/1234' };
        }
    } else if (lowerUrl.includes('max.ru')) {
        const maxRegex = /^https?:\/\/max\.ru\/[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+$/;
        if (!maxRegex.test(url)) {
             return { valid: false, error: 'Неверный формат ссылки MAX. Пример: https://max.ru/SolovievLive/AZ1IPfp6RNs' };
        }
    }

    return { valid: true, error: '' };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLink(val);
      if (val.trim() !== '') {
          const validation = validateLink(val);
          setError(validation.error);
      } else {
          setError('');
      }
  };

  const handleSave = async () => {
    const validation = validateLink(link);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSave(record.id, link.trim());
      onClose();
    } catch (err) {
      setError('Ошибка при сохранении ссылки. Пожалуйста, проверьте корректность ссылки.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full max-h-[90vh] sm:h-auto sm:max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
             <button 
                onClick={onClose}
                className="sm:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
             >
                <ArrowLeft size={24} />
             </button>
             <h3 className="text-lg sm:text-xl font-bold text-gray-900">
               {record.link ? 'Редактировать ссылку' : 'Добавить ссылку'}
             </h3>
          </div>
          <button 
            onClick={onClose}
            className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{report.name || report.themeDisplay}</h4>
            
            <div className="space-y-1 text-sm text-gray-600">
                <p>Тип: {report.themeDisplay}</p>
                {report.startDate && report.endDate && (
                  <p>Период: {format(parseISO(report.startDate), 'd MMMM yyyy', { locale: ru })} — {format(parseISO(report.endDate), 'd MMMM yyyy', { locale: ru })}</p>
                )}
                <p className="mt-2">Депутат: <span className="font-bold text-gray-900">{deputy.fio}</span></p>
                <p>Уровень: {deputy.levelDisplay || deputy.level}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Ссылка на отчет
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon size={16} className="text-gray-400" />
              </div>
              <input
                type="url"
                value={link}
                onChange={handleChange}
                placeholder="https://..."
                className={`block w-full pl-10 pr-3 py-3 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
                  error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && !error && link.trim() && handleSave()}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white sm:bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="order-2 sm:order-1 w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Отменить
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !link.trim() || !!error}
            className="order-1 sm:order-2 flex items-center justify-center w-full sm:w-auto min-w-[140px] px-4 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              'Отправить ссылку'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
