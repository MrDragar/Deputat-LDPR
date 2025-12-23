import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TextInput from '../../components/ui/TextInput';
import { APIError } from '../../services/api';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message || 'Не удалось войти. Проверьте логин и пароль.');
      } else {
        setError('Произошла неизвестная ошибка.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1554284126-d915354a8b0d?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')"}}>
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-700 mb-4">ЛДПР</h1>
            <h2 className="text-2xl font-bold text-gray-900">Вход в систему</h2>
            <p className="text-gray-600 mt-2 text-sm">Войдите, чтобы начать работу с анкетами кандидатов.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <TextInput
              name="username"
              id="username"
              type="text"
              placeholder="Логин"
              value={username}
              onChange={(_, val) => setUsername(val)}
              required
              autoComplete="username"
              icon={<User className="h-5 w-5 text-gray-400" />}
            />
            <div className="space-y-2">
                <TextInput
                  name="password"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Пароль"
                  value={password}
                  onChange={(_, val) => setPassword(val)}
                  required
                  autoComplete="current-password"
                  icon={<Lock className="h-5 w-5 text-gray-400" />}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors" aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                />
                 <div className="text-right">
                  <a href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                    Забыли пароль?
                  </a>
                </div>
            </div>

            {error && <p className="text-sm text-red-600 text-center !mt-6">{error}</p>}
            
            <div className="!mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed disabled:scale-100"
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </div>
          </form>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-800/80">
            Нет аккаунта?{' '}
            <a
              href="https://t.me/deputat_lpdr_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:underline"
            >
              Зарегистрируйтесь через Telegram
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;