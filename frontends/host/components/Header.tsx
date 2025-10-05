import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const renderAuthButtons = () => {
        if (!isAuthenticated) {
            return (
                <Link
                    to="/auth/login"
                    className="px-4 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                >
                    Вход в аккаунт
                </Link>
            );
        }

        return (
            <>
                {/* Ролевые ссылки */}
                {user?.role === "admin" && (
                    <>
                        <Link
                            to="/auth/forms"
                            className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Заявки депутатов
                        </Link>
                        <a
                            href="/api/auth/admin"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Админ-панель
                        </a>
                    </>
                )}
                {user?.role === "coordinator" && (
                    <>
                        <Link
                            to="/svetofor"
                            className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Светофор
                        </Link>
                        <Link
                            to="/dashboard"
                            className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Дашборды
                        </Link>
                    </>
                )}
                {user?.role === "deputy" && (
                    <>
                       <Link
                            to="/month_report"
                            className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Отчёт за месяц
                        </Link>
                        <Link
                            to="/congrats_letter"
                            className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Поздравительное письмо
                        </Link>
                       <Link
                            to="/report"
                            className="px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Отчёт за полугодие
                        </Link>
                    </>
                )}
                
                {/* Кнопка выхода для всех авторизованных */}
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-base font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors"
                >
                    Выйти
                </button>
            </>
        );
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-30">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-bold text-blue-700 hover:text-blue-800 transition-colors">
                            ЛДПР
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {renderAuthButtons()}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
