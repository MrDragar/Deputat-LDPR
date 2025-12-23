import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '../types';

interface RemoteDataContextType {
  userData: User | null;
  isStandalone: boolean;
}

const RemoteDataContext = createContext<RemoteDataContextType>({
  userData: null,
  isStandalone: true, // По умолчанию standalone (если запущен отдельно)
});

export const useRemoteData = () => useContext(RemoteDataContext);

interface RemoteDataProviderProps {
  children: ReactNode;
  userData?: User | null;
}

export const RemoteDataProvider: React.FC<RemoteDataProviderProps> = ({ 
  children, 
  userData = null 
}) => {
  // Проверяем, запущен ли микрофронтенд standalone
  const isStandalone = !window.parent || window.parent === window;
  
  // Если в режиме хоста пытаемся получить данные из родителя
  const dataFromHost = !isStandalone 
    ? (window as any).__REMOTE_DATA__?.userData 
    : null;

  return (
    <RemoteDataContext.Provider 
      value={{ 
        userData: userData || dataFromHost, 
        isStandalone 
      }}
    >
      {children}
    </RemoteDataContext.Provider>
  );
};

// Хелпер для установки данных из хоста
export const setRemoteDataFromHost = (data: { userData: User | null }) => {
  (window as any).__REMOTE_DATA__ = data;
};