import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout: React.FC = () => {
  const [isCollapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    // Используем h-[100dvh] вместо h-screen.
    // 100dvh (dynamic viewport height) корректно учитывает мобильные панели браузера.
    // overflow-hidden здесь важен, чтобы контейнер сам не вызывал скролл страницы.
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setCollapsed={setCollapsed} 
        isMobileOpen={isMobileOpen} 
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        {/* Скролл происходит ТОЛЬКО внутри этого элемента main */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;