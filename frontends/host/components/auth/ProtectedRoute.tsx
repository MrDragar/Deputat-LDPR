// components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Пока идет загрузка - ничего не рендерим
  if (isLoading) {
    return null; // Или <></> для пустого фрагмента
  }

  // После загрузки проверяем аутентификацию
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Проверяем роли
  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;