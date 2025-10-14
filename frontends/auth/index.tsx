import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';

// Импортируем компоненты напрямую
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import DetailPage from './components/DetailPage';

// Mock данные для демонстрации
const generateMockForms = (count: number) => {
  const mockForms = [];
  const names = [
    { first: 'Иван', last: 'Петров', middle: 'Сергеевич' },
    { first: 'Мария', last: 'Сидорова', middle: 'Александровна' },
    { first: 'Алексей', last: 'Козлов', middle: 'Дмитриевич' },
    { first: 'Елена', last: 'Николаева', middle: 'Владимировна' },
    { first: 'Дмитрий', last: 'Орлов', middle: 'Павлович' },
  ];

  const regions = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'];
  const spheres = ['IT', 'Образование', 'Медицина', 'Строительство', 'Торговля'];

  for (let i = 0; i < count; i++) {
    const name = names[i % names.length];
    mockForms.push({
      user: i + 1,
      firstName: name.first,
      lastName: name.last,
      middleName: name.middle,
      region: regions[i % regions.length],
      birthDate: `199${i % 10}-0${(i % 9) + 1}-${(i % 28) + 1}`,
      gender: i % 2 === 0 ? 'Мужской' : 'Женский',
      maritalStatus: i % 3 === 0 ? 'Женат/Замужем' : 'Холост/Не замужем',
      phone: `+7 (999) 000-00-${i.toString().padStart(2, '0')}`,
      email: `user${i + 1}@example.com`,
      vkPage: `https://vk.com/user${i + 1}`,
      vkGroup: `https://vk.com/club${i + 1}`,
      telegramChannel: `@user${i + 1}`,
      personalSite: i % 4 === 0 ? `https://user${i + 1}.com` : undefined,
      partyExperience: (5 + i).toString(),
      partyPosition: ['Активист', 'Координатор', 'Руководитель'][i % 3],
      partyRole: ['Волонтер', 'Организатор', 'Куратор'][i % 3],
      representativeBodyName: ['Городская дума', 'Законодательное собрание', 'Совет депутатов'][i % 3],
      representativeBodyLevel: ['Муниципальный', 'Региональный', 'Федеральный'][i % 3],
      representativeBodyPosition: ['Депутат', 'Советник', 'Помощник'][i % 3],
      committeeName: ['Бюджетный комитет', 'Социальный комитет', 'Экономический комитет'][i % 3],
      committeeStatus: ['Член', 'Заместитель', 'Председатель'][i % 3],
      professionalSphere: [spheres[i % spheres.length], spheres[(i + 1) % spheres.length]],
      sports: ['Футбол', 'Хоккей', 'Теннис'].slice(0, (i % 3) + 1),
      hobbies: ['Чтение', 'Музыка', 'Путешествия'].slice(0, (i % 3) + 1),
      recreation: ['Отдых на природе', 'Кино', 'Рестораны'].slice(0, (i % 3) + 1),
      awards: i % 4 === 0 ? 'Грамота за активную работу' : undefined,
      superpower: i % 3 === 0 ? 'Быстрое обучение' : undefined,
      talents: i % 2 === 0 ? 'Игра на гитаре' : undefined,
      education: [
        {
          id: 1,
          level: 'Высшее',
          organization: 'МГУ им. Ломоносова',
          hasDegree: 'Да',
          degreeType: 'Бакалавр',
          hasTitle: 'Нет',
          titleType: ''
        }
      ],
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    });
  }
  return mockForms;
};

const MOCK_FORMS = generateMockForms(8);

// Mock API service для демонстрации
const mockApi = {
  login: async (username: string, password: string) => {
    console.log('Mock API login called with:', username, password);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockToken = btoa(JSON.stringify({
      login: username,
      role: 'admin',
      exp: Date.now() + 24 * 60 * 60 * 1000
    }));
    
    const mockResponse = {
      access: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockToken}.signature`
    };
    
    localStorage.setItem('authToken', mockResponse.access);
    window.dispatchEvent(new Event('storage'));
    
    return mockResponse;
  },
  
  logout: () => {
    console.log('Mock API logout called');
    localStorage.removeItem('authToken');
    window.dispatchEvent(new Event('storage'));
  },

  getForms: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_FORMS;
  },

  getFormById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const form = MOCK_FORMS.find(f => f.user.toString() === id);
    if (!form) throw new Error('Form not found');
    return form;
  },

  processForm: async (id: number, status: boolean, message: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Processing form ${id}: ${status ? 'approved' : 'declined'} - ${message}`);
    return { success: true };
  }
};

// Создаем Auth Context для галереи
const AuthContext = React.createContext<any>(null);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Компонент для защиты маршрутов
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/gallery/login" replace />;
};

// Компонент галереи для разработки
const DevGallery: React.FC = () => {
  const location = useLocation();
  
  const components = [
    { path: '/gallery/login', name: 'Login Page', description: 'Страница входа в систему' },
    { path: '/gallery/dashboard', name: 'Dashboard Page', description: 'Дашборд со списком заявок' },
    { path: '/gallery/detail/1', name: 'Detail Page (Заявка 1)', description: 'Детальная страница заявки' },
    { path: '/gallery/detail/2', name: 'Detail Page (Заявка 2)', description: 'Детальная страница с другими данными' }
  ];

  // Если мы на странице компонента, показываем кнопку назад
  if (location.pathname !== '/gallery' && location.pathname.startsWith('/gallery')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link 
              to="/gallery"
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Назад к галерее
            </Link>
            <span className="text-sm text-gray-500">Режим разработки</span>
          </div>
        </div>
        {/* Здесь будет рендериться выбранный компонент через Routes */}
      </div>
    );
  }

  // Главная страница галереи
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎨 Компоненты приложения</h1>
          <p className="text-gray-600">Галерея всех страниц приложения для разработки и тестирования</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {components.map((component) => (
            <Link
              key={component.path}
              to={component.path}
              className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{component.name}</h3>
              <p className="text-gray-600 text-sm">{component.description}</p>
              <div className="mt-4 text-blue-600 text-sm font-medium">Посмотреть →</div>
            </Link>
          ))}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-yellow-800 font-semibold mb-2">ℹ️ Информация для разработки</h4>
          <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
            <li>Все данные являются тестовыми и генерируются автоматически</li>
            <li>Для входа используйте любые данные (username/password)</li>
            <li>Изменения не сохраняются после перезагрузки</li>
            <li>Для выхода из режима галереи перейдите на <Link to="/auth" className="underline">основное приложение</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Главный компонент приложения для галереи
const GalleryApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(
    !!localStorage.getItem('authToken')
  );

  React.useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    };

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await mockApi.login(username, password);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      // Для демо purposes, даже при ошибке имитируем успешный логин
      await mockApi.login(username, password);
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    mockApi.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <Routes>
        {/* Маршруты галереи */}
        <Route path="/gallery" element={<DevGallery />} />
        <Route path="/gallery/login" element={<LoginPage />} />
        <Route 
          path="/gallery/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/gallery/detail/:id" 
          element={
            <ProtectedRoute>
              <DetailPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Перенаправление с корня на галерею в dev режиме */}
        <Route path="/" element={<Navigate to="/gallery" replace />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/gallery" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
};

// Переопределяем API для использования mock данных в режиме разработки
if (import.meta.env.DEV) {
  // Сохраняем mock API в глобальной области для использования в компонентах
  (window as any).__MOCK_API__ = mockApi;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GalleryApp />
    </BrowserRouter>
  </React.StrictMode>
);
