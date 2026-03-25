import React, { useState, useEffect } from 'react';
import { refreshToken } from './api';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasToken, setHasToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      const refresh = localStorage.getItem('refreshToken');
      if (refresh) {
        const success = await refreshToken();
        if (success) {
          setHasToken(true);
        } else {
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const handleSaveToken = async () => {
    if (tokenInput.trim()) {
      setIsLoading(true);
      setError('');
      localStorage.setItem('refreshToken', tokenInput.trim());
      const success = await refreshToken();
      if (success) {
        setHasToken(true);
      } else {
        setError('Неверный refresh token или ошибка авторизации');
        localStorage.removeItem('refreshToken');
      }
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" id='reports-view-root'>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (hasToken) {
    return <div id='reports-view-root'>{children}</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" id='reports-view-root'>
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Авторизация</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Refresh Token</label>
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Введите refresh token..."
          />
        </div>
        <button
          onClick={handleSaveToken}
          disabled={!tokenInput.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Сохранить и войти
        </button>
      </div>
    </div>
  );
};
