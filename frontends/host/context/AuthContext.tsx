// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface User {
  login: string;
  role: string;
  user_id: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Функция для проверки токена без побочных эффектов
const validateToken = (token: string | null): { isValid: boolean; user: User | null } => {
  if (!token) return { isValid: false, user: null };

  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));

    // Проверка срока действия
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.warn('Token expired');
      localStorage.removeItem('authToken');
      return { isValid: false, user: null };
    }

    const user: User = {
      login: decoded.login,
      role: decoded.role,
      user_id: decoded.user_id,
    };

    return { isValid: true, user };
  } catch (error) {
    console.error('Invalid token format:', error);
    localStorage.removeItem('authToken');
    return { isValid: false, user: null };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Начинаем с true
  const navigate = useNavigate();

  // ИНИЦИАЛИЗАЦИЯ ПРИ МОНТИРОВАНИИ
  useEffect(() => {
    const initAuth = () => {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const { isValid, user } = validateToken(token);
      
      if (isValid && user) {
        setIsAuthenticated(true);
        setUser(user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      
      // Важно: setTimeout для гарантии отрисовки
      setTimeout(() => setIsLoading(false), 0);
    };

    initAuth();
  }, []); // Пустой массив зависимостей - только при монтировании

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login(username, password);
      localStorage.setItem('authToken', response.access);
      
      const { isValid, user } = validateToken(response.access);
      
      if (isValid && user) {
        setIsAuthenticated(true);
        setUser(user);
        navigate('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Проверка токена при каждом запросе API (опционально)
  useEffect(() => {
    const handleApiRequest = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const { isValid } = validateToken(token);
        if (!isValid) {
          logout();
        }
      }
    };

    // Можно повесить на события API
    window.addEventListener('api-request', handleApiRequest);
    
    return () => {
      window.removeEventListener('api-request', handleApiRequest);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      isLoading, 
      login, 
      logout 
    }}>
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