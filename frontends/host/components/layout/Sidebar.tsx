import React, { lazy } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  FileText, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  Users,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  LayoutDashboard,
  LetterTextIcon,
  PieChart
} from 'lucide-react';
import Logo from '../ui/Logo';

const ReportsApp = lazy(() => import('reports/App'));

interface SidebarProps {
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setCollapsed, isMobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();

  const navGroups = [
    {
      title: '', // Без заголовка для верхнего блока
      items: [
        { to: '/', text: 'Главная', icon: Home, roles: ['admin', 'coordinator', 'employee', 'deputy'], external: false },
        { to: '/autumn-report', text: 'Отчет за осеннюю сессию', icon: Calendar, roles: ['admin', 'coordinator', 'employee', 'deputy'], external: true },
      ]
    },
    {
      title: 'Меню',
      items: [
        { to: '/deputies', text: 'Депутаты', icon: Users, roles: ['admin', 'coordinator'], external: false },
        { to: '/applications', text: 'Заявки', icon: FileText, roles: ['admin'], external: false },
        { to: '/reports', text: 'Отчетность', icon: BarChart3, roles: ['admin', 'coordinator', 'deputy'], external: false },
        { to: '/season_reports_view', text: 'Сезонные отчеты', icon: PieChart, roles: ['admin'], external: false },
        { to: '/my-profile', text: 'Моя анкета', icon: UserIcon, roles: ['deputy', 'coordinator'], external: false },
      ]
    },
    {
      title: 'Дашборды',
      items: [
        { to: '/dashboard', text: 'ВДПГ', icon: LayoutDashboard, roles: ['admin'], external: true },
      ]
    },
    {
      title: 'Инструменты',
      items: [
        { to: '/congrats', text: 'Поздравления', icon: LetterTextIcon, roles: ['admin', 'deputy', 'coordinator'], external: false },
      ]
    }
  ];

  const roleDetails: { [key: string]: { name: string; icon: React.ElementType } } = {
    admin: { name: 'Администратор', icon: ShieldCheck },
    coordinator: { name: 'Координатор', icon: Users },
    employee: { name: 'Сотрудник', icon: Briefcase },
    deputy: { name: 'Депутат', icon: UserIcon },
  };

  const userRoleDetails = user ? roleDetails[user.role] : null;
  const UserRoleIcon = userRoleDetails ? userRoleDetails.icon : UserIcon;

  const sidebarClasses = `
    bg-white border-r border-gray-200 flex flex-col
    transition-transform lg:transition-all duration-300 ease-out
    fixed lg:static inset-y-0 left-0 z-40
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
    ${isCollapsed ? 'w-20' : 'w-64'}
  `;
  
  return (
    <>
        {/* Mobile Overlay */}
        {isMobileOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-30 z-30 lg:hidden"
                onClick={() => setMobileOpen(false)}
            ></div>
        )}
        <aside className={sidebarClasses}>
          <div className="p-4 flex items-center justify-between border-b border-gray-200 h-[69px] flex-shrink-0">
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
              <Logo className="h-7 w-auto" />
            </div>
            <button
                onClick={() => setCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
                aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
            >
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
            {navGroups.map((group, groupIndex) => {
              const filteredItems = group.items.filter(item => user && item.roles.includes(user.role));
              if (filteredItems.length === 0) return null;

              return (
                <React.Fragment key={groupIndex}>
                  <div className="py-2.5">
                    {group.title && (
                      <p className={`px-5 pb-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider transition-all duration-300 ease-out ${isCollapsed ? 'text-center tracking-[0.2em] text-slate-300' : ''}`}>
                        {isCollapsed ? '•••' : group.title}
                      </p>
                    )}
                    <ul className="space-y-0.5 px-3">
                      {filteredItems.map(item => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            target={item.external ? "_blank" : ""}
                            end
                            className={({ isActive }) => {
                                const baseClasses = 'flex items-center h-11 rounded-xl text-[14px] font-medium transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500';
                                const activeClasses = isActive
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600';
                                const layoutClasses = isCollapsed ? 'w-11 justify-center mx-auto' : 'w-full px-3 gap-3.5';
                                return `${baseClasses} ${activeClasses} ${layoutClasses}`;
                            }}
                          >
                            <item.icon className="h-[20px] w-[20px] flex-shrink-0 transition-colors duration-200" />
                            {/* Вместо truncate используем line-clamp-2 для аккуратного переноса строк без обрезания */}
                            <span className={`${isCollapsed ? 'lg:hidden lg:group-hover:block absolute left-full ml-4 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg' : 'line-clamp-2 leading-tight'}`}>
                                {item.text}
                            </span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Линия разделитель (кроме последней группы) */}
                  {groupIndex < navGroups.length - 1 && (
                    <div className="h-px bg-gray-100 mx-5 my-1"></div>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
          
          <div className="p-4 mt-auto border-t border-gray-200 flex-shrink-0">
              <div className={`flex items-center gap-3 transition-all duration-300 ease-out ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <UserRoleIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className={`min-w-0 transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'opacity-100 flex-1'}`}>
                    {userRoleDetails && (
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{userRoleDetails.name}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate">{user?.login}</p>
                  </div>
                  <button
                    onClick={logout}
                    className={`rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-all duration-200 ${isCollapsed ? 'hidden' : 'p-2 opacity-100'}`}
                    aria-label="Выйти"
                  >
                    <LogOut className="h-[18px] w-[18px]" />
                  </button>
              </div>
          </div>
        </aside>
    </>
  );
};

export default Sidebar;