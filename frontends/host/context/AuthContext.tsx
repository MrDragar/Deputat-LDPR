import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface User {
  login: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}


const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('authToken'));
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Функция для декодирования JWT токена
  const decodeJWT = useCallback((token: string): User | null => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return {
        login: decoded.login,
        role: decoded.role
      };
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      const userData = decodeJWT(token);
      setUser(userData);
    }
  }, [decodeJWT]);

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('authToken');
      setIsAuthenticated(!!token);
      if (token) {
        setUser(decodeJWT(token));
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
    };
  }, [decodeJWT]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await api.login(username, password);
      setIsAuthenticated(true);
      const userData = decodeJWT(response.access);
      setUser(userData);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [navigate, decodeJWT]);

  const logout = useCallback(() => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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