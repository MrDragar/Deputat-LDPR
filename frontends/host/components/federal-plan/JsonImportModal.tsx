import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileJson2, AlertTriangle } from 'lucide-react';
import type { DailyPlan, EventCategory, EventTheme } from '../../data/federalPlanData';
import { eventCategoryOptions, eventThemeOptions } from '../../data/federalPlanData';

// TypeGuards for validation
const isString = (val: unknown): val is string => typeof val === 'string';
const isBoolean = (val: unknown): val is boolean => typeof val === 'boolean';
const isNumber = (val: unknown): val is number => typeof val === 'number';
const isObject = (val: unknown): val is Record<string, unknown> => typeof val === 'object' && val !== null && !Array.isArray(val);

const validCategories = new Set(eventCategoryOptions.map(o => o.value));
const validThemes = new Set(eventThemeOptions.map(o => o.value));

const isEventCategory = (val: unknown): val is EventCategory => isString(val) && (val === '' || validCategories.has(val as EventCategory));
const isEventTheme = (val: unknown): val is EventTheme => isString(val) && (val === '' || validThemes.has(val as EventTheme));

function validatePlanEvent(event: unknown): string | null {
    if (!isObject(event)) return 'Элемент события не является объектом.';
    if (!isNumber(event.id)) return 'Поле `id` события должно быть числом.';
    if (!isString(event.title) || event.title.trim() === '') return 'Поле `title` события должно быть непустой строкой.';
    if (!isEventCategory(event.category)) return `Категория события "${event.category}" недействительна.`;
    if (!isEventTheme(event.theme)) return `Тема события "${event.theme}" недействительна.`;
    if (!isBoolean(event.isInfostrike)) return 'Поле `isInfostrike` события должно быть логическим значением.';
    if (!isObject(event.details)) return 'Поле `details` события должно быть объектом.';
    for (const [key, value] of Object.entries(event.details)) {
        if (!isString(value)) return `Значение для ключа "${key}" в деталях не является строкой.`;
    }
    return null;
}

function validateDailyPlan(data: unknown): { plan: DailyPlan | null; error: string | null } {
    if (!isObject(data)) return { plan: null, error: 'Предоставленные данные не являются объектом.' };
    
    if (!isString(data.date) || (data.date !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(data.date))) {
        return { plan: null, error: 'Поле `date` имеет неверный формат (требуется YYYY-MM-DD или пустая строка).' };
    }
    if (!Array.isArray(data.holidays) || !data.holidays.every(isString)) {
        return { plan: null, error: 'Поле `holidays` должно быть массивом строк.' };
    }
    if (!Array.isArray(data.events)) {
        return { plan: null, error: 'Поле `events` должно быть массивом.' };
    }
    for (let i = 0; i < data.events.length; i++) {
        const eventError = validatePlanEvent(data.events[i]);
        if (eventError) return { plan: null, error: `Ошибка в событии #${i + 1}: ${eventError}` };
    }

    // FIX: Cast to unknown first to satisfy TypeScript's strict type checking for conversions.
    return { plan: data as unknown as DailyPlan, error: null };
}


interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (plan: DailyPlan) => string | void;
}

const JsonImportModal: React.FC<JsonImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const portalRoot = document.getElementById('root');

    const handleImportClick = () => {
        setError(null);
        if (jsonText.trim() === '') {
            setError('Поле для JSON не может быть пустым.');
            return;
        }

        try {
            const parsedJson = JSON.parse(jsonText);
            const { plan, error: validationError } = validateDailyPlan(parsedJson);
            
            if (validationError) {
                setError(validationError);
                return;
            }

            if (plan) {
                const importError = onImport(plan);
                if (importError) {
                    setError(importError);
                } else {
                    setJsonText(''); // Clear on success, parent handles closing
                }
            }
        } catch (e) {
            if (e instanceof Error) {
                setError(`Неверный формат JSON: ${e.message}`);
            } else {
                setError('Произошла неизвестная ошибка при обработке JSON.');
            }
        }
    };

    if (!isOpen || !portalRoot) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="json-import-title"
        >
            <div 
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl m-4 flex flex-col transform transition-all max-h-[90vh]"
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FileJson2 className="h-6 w-6 text-blue-600"/>
                        <h2 id="json-import-title" className="text-lg font-bold text-gray-900">Импорт из JSON</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        aria-label="Закрыть"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </header>

                <main className="p-6 flex-grow overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-4">
                        Вставьте JSON-код, чтобы автоматически заполнить данные для этой даты. Убедитесь, что структура соответствует требуемому формату.
                    </p>
                    <textarea
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        placeholder='{ "date": "", "holidays": [], "events": [] }'
                        className={`w-full h-80 p-4 border rounded-lg font-mono text-sm bg-slate-50 text-gray-900 focus:outline-none focus:ring-2 resize-y
                            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
                        `}
                        aria-label="Поле для ввода JSON"
                        spellCheck="false"
                    />
                    {error && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </main>

                <footer className="p-4 bg-slate-50 border-t border-gray-200 flex-shrink-0 flex justify-end gap-4">
                     <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 text-base font-semibold rounded-lg transition-all shadow-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Отмена
                    </button>
                    <button
                        type="button"
                        onClick={handleImportClick}
                        className="w-full sm:w-auto px-6 py-2.5 text-base font-semibold rounded-lg transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Заполнить поля
                    </button>
                </footer>
            </div>
        </div>,
        portalRoot
    );
};

export default JsonImportModal;