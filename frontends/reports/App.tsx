import React, { useEffect, useState } from 'react';
import { RemoteDataProvider } from './context/RemoteDataContext';
import RegistrationPage from './pages/RegistrationPage';
import { User } from './types';
import './index.css'  // Импорт Tailwind CSS

interface AppProps {
  userData?: User | null;
}

// Компонент для хоста
const App: React.FC<AppProps> = ({ userData }) => {
  useEffect(() => {
    console.log('Host режим: получены данные из пропсов:', userData);
    
    if (userData) {
      (window as any).__REMOTE_DATA__ = { userData };
    }
  }, [userData]);

  return (
    <RemoteDataProvider userData={userData}>
      <RegistrationPage />
    </RemoteDataProvider>
  );
};

export default App;