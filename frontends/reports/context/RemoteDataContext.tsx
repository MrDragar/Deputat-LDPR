// context/RemoteDataContext.tsx
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User } from '../types';

interface RemoteDataContextType {
  userData: User | null;
  isStandalone: boolean;
  isLoading: boolean; // Добавим состояние загрузки
}

const RemoteDataContext = createContext<RemoteDataContextType>({
  userData: null,
  isStandalone: true,
  isLoading: true,
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
  const [state, setState] = useState<RemoteDataContextType>({
    userData: null,
    isStandalone: true,
    isLoading: true,
  });

  useEffect(() => {
    // Проверяем, standalone ли мы
    const isStandalone = !window.parent || window.parent === window;
    
    let finalUserData = userData;
    
    // Если userData не передан через пропсы, пробуем получить из window
    if (!finalUserData) {
      const dataFromWindow = (window as any).__REMOTE_DATA__?.userData;
      finalUserData = dataFromWindow;
    }
    
    // Если standalone и данных нет - устанавливаем заглушку
    if (isStandalone && !finalUserData) {
      console.log('Standalone режим: данные не найдены');
      // Можно установить заглушку здесь или в App.tsx
    }
    
    setState({
      userData: finalUserData,
      isStandalone,
      isLoading: false, // Загрузка завершена
    });
    
    console.log('RemoteDataProvider установил:', { 
      userData: finalUserData, 
      isStandalone, 
      source: userData ? 'props' : 'window' 
    });
  }, [userData]);

  return (
    <RemoteDataContext.Provider value={state}>
      {children}
    </RemoteDataContext.Provider>
  );
};

// Хелпер для установки данных из хоста
export const setRemoteDataFromHost = (data: { userData: User | null }) => {
  console.log('setRemoteDataFromHost вызван с:', data);
  (window as any).__REMOTE_DATA__ = data;
};