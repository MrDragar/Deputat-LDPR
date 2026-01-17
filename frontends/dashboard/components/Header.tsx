
import React from 'react';

const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-on-surface-secondary"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const BellIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-on-surface-secondary"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> );

export const Header: React.FC = () => {
    const today = new Date().toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="h-20 bg-brand-surface px-8 flex items-center justify-between flex-shrink-0 shadow-[0px_4px_12px_rgba(0,0,0,0.02)]">
            <div>
                <h1 className="text-2xl font-semibold text-brand-on-surface-primary">Отчет</h1>
                <p className="text-sm text-brand-on-surface-secondary">{today}</p>
            </div>
            <div className="flex items-center space-x-6">
                <button className="p-2 rounded-full hover:bg-gray-100"><SearchIcon /></button>
                <button className="p-2 rounded-full hover:bg-gray-100"><BellIcon /></button>
                <div className="h-10 w-px bg-gray-200"></div>
                <div className="flex items-center space-x-3">
                    <img src="https://picsum.photos/40/40" alt="User Avatar" className="w-10 h-10 rounded-full" />
                    <div>
                        <p className="font-semibold text-sm text-brand-on-surface-primary">Ferra Alexandra</p>
                        <p className="text-xs text-brand-on-surface-secondary">Admin store</p>
                    </div>
                </div>
            </div>
        </header>
    );
};
