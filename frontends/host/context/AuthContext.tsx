import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('authToken'));
  const navigate = useNavigate();

  // Слушатель для синхронизации состояния между вкладками
  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('authToken'));
    };

    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      await api.login(username, password);
      setIsAuthenticated(true);
      navigate('/'); // Перенаправляем к формам после успешного входа
    } catch (error) {
      console.error('Login failed:', error);
      // Здесь можно добавить обработку ошибок, например, показать уведомление
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    api.logout();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
