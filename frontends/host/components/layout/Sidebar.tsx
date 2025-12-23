import React, {lazy} from 'react';
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
  Calendar
} from 'lucide-react';
const ReportsApp = lazy(() => import('reports/App'));

interface SidebarProps {
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}


const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setCollapsed, isMobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();

 const navItems = [
    { to: '/', text: 'Главная', icon: Home, roles: ['admin', 'coordinator', 'employee', 'deputy'], external: false },
    { to: '/autumn-report', text: 'Отчёт за осеннюю сессию', icon: Calendar, roles: ['admin', 'coordinator', 'employee', 'deputy'], external: true },
    { to: '/deputies', text: 'Наши депутаты', icon: Users, roles: ['admin', 'coordinator'], external: false },
    { to: '/applications', text: 'Заявки', icon: FileText, roles: ['admin'], external: false },
    { to: '/reports', text: 'Отчётность', icon: BarChart3, roles: ['admin', 'coordinator', 'employee'], external: false },
    { to: '/my-profile', text: 'Моя анкета', icon: UserIcon, roles: ['deputy', 'coordinator'], external: false },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

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
          <div className="p-4 flex items-center justify-between border-b border-gray-200 h-[69px]">
            <div className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'w-0' : 'w-full'}`}>
              <h1 className="text-2xl font-bold text-blue-700 whitespace-nowrap">ЛДПР</h1>
            </div>
            <button
                onClick={() => setCollapsed(!isCollapsed)}
                className="hidden lg:flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
            >
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex-1 px-4 py-4">
             <p className={`pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-all duration-300 ease-out ${isCollapsed ? 'text-center' : 'px-4'}`}>
                {isCollapsed ? '•••' : 'Меню'}
             </p>
            <ul className="space-y-1">
              {filteredNavItems.map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    target={item.external?"_blank":""}
                    end
                    className={({ isActive }) => {
                        const baseClasses = 'flex items-center h-12 rounded-lg text-sm font-medium transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500';
                        const activeClasses = isActive
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';
                        const layoutClasses = isCollapsed ? 'w-12 justify-center' : 'w-full px-4 gap-3';
                        return `${baseClasses} ${activeClasses} ${layoutClasses}`;
                    }}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className={`${isCollapsed ? 'lg:hidden lg:group-hover:block absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-50' : ''}`}>
                        {item.text}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 mt-auto border-t border-gray-200">
              <div className={`flex items-center gap-3 transition-all duration-300 ease-out ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <UserRoleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className={`min-w-0 transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'opacity-100 flex-1'}`}>
                    {userRoleDetails && (
                        <p className="text-sm font-semibold text-gray-800 truncate">{userRoleDetails.name}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate">{user?.login}</p>
                  </div>
                  <button
                    onClick={logout}
                    className={`rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 ${isCollapsed ? 'hidden' : 'p-2 opacity-100'}`}
                    aria-label="Выйти"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
              </div>
          </div>
        </aside>
    </>
  );
};

export default Sidebar;