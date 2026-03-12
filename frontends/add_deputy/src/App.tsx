import React, { useState } from 'react';
import { Copy, Check, FileJson, Download } from 'lucide-react';
import TextInput from './components/ui/TextInput';
import Select from './components/ui/Select';
import Alert from './components/ui/Alert';
import { initialFormData, REGIONS, REPRESENTATIVE_BODY_LEVELS } from './constants';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'json'>('single');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const jsonExample = `[
  {
    "telegramId": "-123456789",
    "lastName": "Иванов",
    "firstName": "Иван",
    "middleName": "Иванович",
    "gender": "Мужчина",
    "region": "Москва",
    "representativeBodyLevel": "ЗС"
  },
  {
    "telegramId": "-987654321",
    "lastName": "Петров",
    "firstName": "Петр",
    "gender": "Мужчина",
    "region": "Санкт-Петербург",
    "representativeBodyLevel": "МСУ"
  }
]`;

  const handleCopyExample = () => {
    navigator.clipboard.writeText(jsonExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Single User State
  const [formData, setFormData] = useState({
    telegramId: '',
    lastName: '',
    firstName: '',
    middleName: '',
    gender: '',
    representativeBodyLevel: '',
    region: ''
  });

  // JSON State
  const [jsonInput, setJsonInput] = useState('');

  // Results State
  const [successList, setSuccessList] = useState<any[]>([]);
  const [errorList, setErrorList] = useState<any[]>([]);
  
  // Notification State
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const handleInputChange = (name: string, value: string) => {
    if (name === 'telegramId') {
      if (value !== '' && value !== '-' && !/^-?\d*$/.test(value)) {
        return;
      }
      if (Number(value) > 0) {
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearResults = () => {
    setSuccessList([]);
    setErrorList([]);
    setNotification(null);
  };

  const exportLog = () => {
    let logContent = '=== Успешно добавлены ===\n';
    successList.forEach(user => {
      logContent += `${user.lastName} ${user.firstName} ${user.middleName || ''} (ID: ${user.telegramId || '—'}, Регион: ${user.region || '—'})\n`;
    });
    logContent += '\n=== Ошибки добавления ===\n';
    errorList.forEach(user => {
      logContent += `${user.lastName} ${user.firstName} ${user.middleName || ''} (ID: ${user.telegramId || '—'}, Регион: ${user.region || '—'}) - Ошибка: ${user.error}\n`;
    });

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseNumberField = (val: any) => {
    if (val === '' || val === null || val === undefined) return val;
    const num = Number(val);
    return isNaN(num) ? val : num;
  };

  const addUser = async (userData: any) => {
    // Ensure numeric fields are correctly typed
    const processedData = { ...userData };
    
    // Default telegramId if missing or invalid
    if (!processedData.telegramId || processedData.telegramId === '—' || processedData.telegramId === '-') {
      processedData.telegramId = -Math.floor(Math.random() * 1000000000);
    } else {
      processedData.telegramId = parseNumberField(processedData.telegramId);
    }

    // Default birthDate
    if (!processedData.birthDate) {
      processedData.birthDate = '01.01.1970';
    }

    // Default email and phone
    if (!processedData.email) {
      processedData.email = 'fake@email.com';
    }

    if (processedData.childrenCount) processedData.childrenCount = parseNumberField(processedData.childrenCount);
    if (processedData.underageChildrenCount) processedData.underageChildrenCount = parseNumberField(processedData.underageChildrenCount);

    const finalData = { ...initialFormData, ...processedData };

    // Set defaults for required fields that might be blank
    const dashFields = [
      'phone', 'partyPosition', 'partyRole', 
      'representativeBodyName', 'representativeBodyPosition', 
      'committeeName', 'additionalInfo', 
      'suggestions', 'talents', 'knowledgeToShare'
    ];
    
    dashFields.forEach(field => {
      if (!finalData[field]) {
        finalData[field] = '-';
      }
    });

    if (!finalData.committeeStatus || finalData.committeeStatus === '-') {
      finalData.committeeStatus = 'Член';
    }

    const linkFields = ['vkPage', 'vkGroup', 'telegramChannel', 'personalSite'];
    linkFields.forEach(field => {
      if (!finalData[field] || finalData[field] === '-') {
        finalData[field] = 'https://fake.com';
      }
    });

    if (finalData.partyExperience === '' || finalData.partyExperience === null || finalData.partyExperience === undefined) {
      finalData.partyExperience = 0;
    } else {
      finalData.partyExperience = parseNumberField(finalData.partyExperience);
    }
    
    // Ensure userId is present for the backend
    const payload = {
      ...finalData,
      userId: finalData.telegramId,
      user_id: finalData.telegramId
    };
    
    try {
      const response = await fetch('https://депутатлдпр.рф/api/auth/registration-forms/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMessage = 'Ошибка при отправке формы.';
        
        if (errorData && typeof errorData === 'object') {
            const generalErrors = errorData.nonFieldErrors || errorData.detail;
            if (generalErrors && (typeof generalErrors === 'string' || (Array.isArray(generalErrors) && typeof generalErrors[0] === 'string'))) {
                errorMessage = Array.isArray(generalErrors) ? generalErrors[0] : generalErrors;
            } else {
                const firstErrorKey = Object.keys(errorData).find(key => 
                    errorData[key] && (typeof errorData[key] === 'string' || (Array.isArray(errorData[key]) && typeof errorData[key][0] === 'string'))
                );
                if (firstErrorKey) {
                    const fieldError = Array.isArray(errorData[firstErrorKey]) ? errorData[firstErrorKey][0] : errorData[firstErrorKey];
                    errorMessage = `${firstErrorKey}: ${fieldError}`;
                }
            }
        } else if (typeof errorData === 'string') {
            errorMessage = errorData;
        }
        throw new Error(errorMessage);
      }

      const successData = await response.json();
      
      // Extract the correct ID from the response. The user ID is often the negative telegramId.
      const formId = successData.id ?? successData.userId ?? successData.user_id ?? successData.telegramId ?? finalData.telegramId;
      
      // Process form
      try {
        if (formId !== undefined && formId !== null) {
          await api.processForm(formId, true, "Принято");
        } else {
          console.warn("Could not find ID in response:", successData);
          throw new Error("Не удалось получить ID созданной анкеты из ответа сервера");
        }
      } catch (processError: any) {
        let errorMsg = processError.message;
        if (processError.data && processError.data.error && processError.data.error !== processError.message) {
          errorMsg += ` | Дополнительно: ${processError.data.error}`;
        }
        throw new Error(`Пользователь добавлен, но произошла ошибка при обработке (processForm): ${errorMsg}`);
      }
      
      setSuccessList(prev => [...prev, { ...userData, id: formId }]);
      return true;
    } catch (error: any) {
      setErrorList(prev => [...prev, { ...userData, error: error.message }]);
      return false;
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.region) {
      setNotification({ message: 'Регион обязателен для заполнения', type: 'error' });
      return;
    }
    if (!formData.gender) {
      setNotification({ message: 'Пол обязателен для заполнения', type: 'error' });
      return;
    }
    if (formData.telegramId && isNaN(Number(formData.telegramId))) {
      setNotification({ message: 'ID должен быть числом', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    const success = await addUser(formData);
    setIsLoading(false);

    if (success) {
      setNotification({ message: 'Пользователь успешно добавлен', type: 'success' });
      setFormData({
        telegramId: '',
        lastName: '',
        firstName: '',
        middleName: '',
        gender: '',
        representativeBodyLevel: '',
        region: ''
      });
    } else {
      setNotification({ message: 'Ошибка при добавлении пользователя', type: 'error' });
    }
  };

  const handleJsonSubmit = async () => {
    if (!jsonInput.trim()) return;
    
    setIsLoading(true);
    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonInput);
      } catch (parseError: any) {
        throw new Error(`Некорректный формат JSON: ${parseError.message}`);
      }

      if (!Array.isArray(parsed)) {
        throw new Error('Ожидается массив объектов в формате JSON');
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const user of parsed) {
        const success = await addUser(user);
        if (success) successCount++;
        else errorCount++;
      }
      
      setNotification({ 
        message: `Обработка завершена. Успешно: ${successCount}, Ошибок: ${errorCount}`, 
        type: errorCount > 0 ? 'warning' : 'success' 
      });
      if (errorCount === 0) {
        setJsonInput('');
      }
    } catch (e: any) {
      setNotification({ message: e.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8" id='add-deputy-root'>
      {notification && (
        <Alert
          type={notification.type}
          title={notification.type === 'error' ? 'Ошибка' : notification.type === 'warning' ? 'Внимание' : 'Успех'}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Добавление пользователей</h1>
          {(successList.length > 0 || errorList.length > 0) && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button 
                onClick={exportLog}
                className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Выгрузить лог
              </button>
              <button 
                onClick={clearResults}
                className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] transition-all shadow-sm"
              >
                Очистить результаты
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-3 sm:py-4 px-2 sm:px-6 text-center text-sm sm:text-base font-medium transition-all cursor-pointer rounded-tl-xl ${activeTab === 'single' ? 'bg-blue-600 text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'}`}
              onClick={() => setActiveTab('single')}
            >
              Один пользователь
            </button>
            <button
              className={`flex-1 py-3 sm:py-4 px-2 sm:px-6 text-center text-sm sm:text-base font-medium transition-all cursor-pointer rounded-tr-xl ${activeTab === 'json' ? 'bg-blue-600 text-white shadow-inner' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200'}`}
              onClick={() => setActiveTab('json')}
            >
              Массовое добавление <span className="whitespace-nowrap">(JSON)</span>
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'single' ? (
              <form onSubmit={handleSingleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextInput
                    label="ID (отрицательный)"
                    name="telegramId"
                    value={formData.telegramId}
                    onChange={handleInputChange}
                    placeholder="-123456789"
                  />
                  <TextInput
                    label="Фамилия"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                  <TextInput
                    label="Имя"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                  <TextInput
                    label="Отчество"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                  />
                  <Select
                    label="Пол"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    options={[
                      { value: 'Мужчина', label: 'Мужчина' },
                      { value: 'Женщина', label: 'Женщина' }
                    ]}
                    required
                  />
                  <Select
                    label="Уровень"
                    name="representativeBodyLevel"
                    value={formData.representativeBodyLevel}
                    onChange={handleInputChange}
                    options={REPRESENTATIVE_BODY_LEVELS.map(level => {
                      let label = level;
                      if (level === 'ЗС') label = 'Законодательное Собрание (ЗС)';
                      if (level === 'АЦС') label = 'Административный центр субъекта (АЦС)';
                      if (level === 'МСУ') label = 'Местное самоуправление (МСУ)';
                      return { value: level, label };
                    })}
                    required
                  />
                  <Select
                    label="Регион депутата"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    options={REGIONS.map(region => ({ value: region, label: region }))}
                    required
                    searchable
                  />
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                        Добавление...
                      </>
                    ) : (
                      'Добавить пользователя'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="font-medium text-blue-800 mb-2">Формат JSON:</p>
                  Введите массив объектов JSON. Каждый объект должен содержать необходимые поля формы.
                  <br />
                  <span className="font-semibold">Обязательные поля:</span> telegramId (отрицательное число), lastName, firstName, gender ("Мужчина" или "Женщина"), region, representativeBodyLevel.
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Пример формата:</span>
                    <button 
                      onClick={handleCopyExample}
                      className="text-xs flex items-center gap-1.5 text-gray-600 hover:text-gray-800 active:text-gray-900 transition-all bg-gray-100 hover:bg-gray-200 active:bg-gray-300 active:scale-95 px-3 py-1.5 rounded-md font-medium"
                      type="button"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? <span className="text-green-700">Скопировано</span> : 'Копировать пример'}
                    </button>
                  </div>
                  <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                    {jsonExample}
                  </pre>
                </div>

                <TextInput
                  type="textarea"
                  name="jsonInput"
                  value={jsonInput}
                  onChange={(_, value) => setJsonInput(value)}
                  placeholder="Вставьте JSON сюда..."
                  className="font-mono text-sm min-h-[300px]"
                />
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleJsonSubmit}
                    disabled={!jsonInput.trim() || isLoading}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                        Обработка...
                      </>
                    ) : (
                      'Обработать данные'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Results Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
            <div className="bg-green-50 px-6 py-4 border-b border-green-200">
              <h2 className="text-lg font-bold text-green-800">Успешно добавлены ({successList.length})</h2>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {successList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Нет данных</p>
              ) : (
                <ul className="space-y-4">
                  {successList.map((user, idx) => (
                    <li key={idx} className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                      <div className="font-medium text-gray-900">
                        {user.lastName} {user.firstName} {user.middleName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        ID: {user.telegramId || '—'} | Регион: {user.region || '—'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
              <h2 className="text-lg font-bold text-red-800">Ошибки добавления ({errorList.length})</h2>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {errorList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Нет ошибок</p>
              ) : (
                <ul className="space-y-4">
                  {errorList.map((user, idx) => (
                    <li key={idx} className="p-4 bg-red-50/50 rounded-lg border border-red-100">
                      <div className="font-medium text-gray-900">
                        {user.lastName} {user.firstName} {user.middleName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        ID: {user.telegramId || '—'} | Регион: {user.region || '—'}
                      </div>
                      <div className="text-sm text-red-600 mt-2 font-medium">
                        Ошибка: {user.error}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
