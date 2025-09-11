import RegistrationPage from './pages/RegistrationPage';
import React, { createContext, useContext } from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';


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

const App: React.FC<AuthAppProps> = ({ isAuthenticated, login, logout }) => {
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
        <Routes>
          <Route path="/*" element={<RegistrationPage />} />
        </Routes>
      </AuthContext.Provider>
  );
};

export default App;
