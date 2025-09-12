// Этот файл должен находиться по пути: auth/src/App.tsx

import React, { createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Импортируйте ваши существующие страницы
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import DetailPage from './components/DetailPage';

// 1. Определяем интерфейс для props, которые приходят от хоста,
//    а также для локального контекста.
interface AuthAppProps {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// 2. Создаем ЛОКАЛЬНЫЙ AuthContext. Он будет жить только внутри этого микрофронтенда.
const AuthContext = createContext<AuthAppProps | null>(null);

// 3. Создаем ЛОКАЛЬНЫЙ хук useAuth. 
//    Все ваши страницы (LoginPage, DashboardPage) должны импортировать именно его.
export const useAuth = (): AuthAppProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within the AuthApp component, which is exposed from the "auth" microfrontend.');
  }
  return context;
};

// Компонент для защиты маршрутов. Он использует наш локальный useAuth.
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  // Если не авторизован, перенаправляем на страницу входа (используя полный путь)
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
};

// 4. Главный компонент, который хост импортирует. Он принимает props.
const App: React.FC<AuthAppProps> = ({ isAuthenticated, login, logout }) => {
  
  // 5. "Повторно предоставляем" props от хоста через наш локальный AuthContext.Provider.
  //    Теперь все дочерние компоненты могут использовать useAuth() и получать нужные данные.
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {/* 6. Наконец, мы создаем <Routes>. Теперь они находятся внутри <BrowserRouter> хоста 
          и ошибка исчезнет. */}
      <Routes>
        {/* ВАЖНО: Пути здесь относительные, без "/" в начале. */}
        <Route path="login" element={<LoginPage />} />
        
        <Route 
          path="forms" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="forms/:id"
          element={
            <ProtectedRoute>
              <DetailPage />
            </ProtectedRoute>
          } 
        />

        {/* Маршрут по умолчанию для "/auth/*". Если пользователь авторизован,
            отправляем на /auth/forms, если нет - на /auth/login. */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? 'forms' : 'login'} replace />} 
        />
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;