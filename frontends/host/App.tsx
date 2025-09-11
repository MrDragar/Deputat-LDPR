import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthProvider, useAuth } from './context/AuthContext';

const RemoteAuthApp = lazy(() => import('auth/App'));
const RemoteRegistrationFormApp = lazy(() => import('registration_form/App'));

const AuthAppWrapper: React.FC = () => {
  // Получаем состояние и функции из контекста хоста
  const { isAuthenticated, login, logout } = useAuth();

  // Передаем их как props в удаленное приложение
  return <RemoteAuthApp isAuthenticated={isAuthenticated} login={login} logout={logout} />;
};

const RegAppWrapper: React.FC = () => {
  // Получаем состояние и функции из контекста хоста
  const { isAuthenticated, login, logout } = useAuth();

  // Передаем их как props в удаленное приложение
  return <RemoteRegistrationFormApp isAuthenticated={isAuthenticated} login={login} logout={logout} />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* Используем обертку для передачи props в auth */}
              <Route path="/auth/*" element={<AuthAppWrapper />} />
              {/* Рендерим registration_form напрямую */}
              <Route path="/registration_form/*" element={<RemoteRegistrationFormApp />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </AuthProvider>
  );
};

export default App;