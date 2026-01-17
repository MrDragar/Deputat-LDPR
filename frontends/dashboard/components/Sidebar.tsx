
import React from 'react';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; }> = ({ icon, label, active }) => (
    <a href="#" className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${active ? 'bg-[#EBF2FF] text-brand-secondary' : 'text-brand-on-surface-secondary hover:bg-gray-100'}`}>
        {icon}
        <span className="font-semibold text-sm">{label}</span>
    </a>
);

const LogoIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#3E66F4"/>
        <path d="M19.9999 10C19.9999 12.2091 18.209 14 15.9999 14C13.7908 14 11.9999 12.2091 11.9999 10C11.9999 7.79086 13.7908 6 15.9999 6C18.209 6 19.9999 7.79086 19.9999 10Z" fill="white"/>
        <path d="M10 24.5C10 21.4624 12.6863 19 16 19C19.3137 19 22 21.4624 22 24.5V26H10V24.5Z" fill="white"/>
    </svg>
);


const DashboardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> );
const ReportIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg> );
const SettingsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.12l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0-2.12l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg> );
const HelpIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> );


export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-brand-surface p-6 flex-shrink-0 shadow-[4px_0px_12px_rgba(0,0,0,0.03)] flex flex-col">
            <div className="flex items-center space-x-3 mb-10">
                <LogoIcon />
                <span className="font-bold text-xl text-brand-on-surface-primary">Дашборд</span>
            </div>
            
            <nav className="flex flex-col space-y-2">
                <p className="text-xs font-semibold text-brand-on-surface-secondary uppercase tracking-wider px-3 pb-2">Меню</p>
                <NavItem icon={<DashboardIcon />} label="Дашборд" />
                <NavItem icon={<ReportIcon />} label="Отчеты" active />
            </nav>

            <div className="mt-auto">
                 <nav className="flex flex-col space-y-2">
                     <p className="text-xs font-semibold text-brand-on-surface-secondary uppercase tracking-wider px-3 pb-2">Инструменты</p>
                    <NavItem icon={<SettingsIcon />} label="Настройки" />
                    <NavItem icon={<HelpIcon />} label="Помощь" />
                </nav>
            </div>
        </aside>
    );
};
