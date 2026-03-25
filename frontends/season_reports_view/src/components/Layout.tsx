import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Users, Menu } from 'lucide-react';
import Logo from './ui/Logo';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = false }) => {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <button className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
          <Menu className="h-6 w-6" />
        </button>
        <Logo className="h-6 w-auto text-blue-700" />
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Sidebar / Navigation */}
      {showSidebar && (
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center">
            <Logo className="h-8 w-auto text-blue-700" />
            <span className="ml-3 font-bold text-lg text-gray-900">ЛДПР Отчеты</span>
          </div>
          
          <nav className="flex-1 p-4 flex flex-col gap-2">
            <NavLink
              to="/seasonal_report"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Users className="h-5 w-5 mr-3" />
              Отчеты депутатов
            </NavLink>
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-auto p-0 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
