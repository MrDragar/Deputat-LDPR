import React from 'react';

const HomePage: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-4xl font-extrabold text-blue-800 mb-4">
                Добро пожаловать на официальный портал ЛДПР
            </h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
                Это главная страница нашего приложения-оболочки. Используйте навигацию в шапке сайта для перехода к разделу аутентификации или другим доступным микрофронтендам.
            </p>
            <div className="mt-8">
                <a 
                    href="https://ldpr.ru/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-md transition-transform transform hover:scale-105"
                >
                    Перейти на основной сайт
                </a>
            </div>
        </div>
    );
};

export default HomePage;
