import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="lg:hidden flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
            <button 
                onClick={onMenuClick} 
                className="p-2 text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Открыть меню"
            >
                <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 text-lg font-bold text-blue-700">ЛДПР</div>
        </header>
    );
};

export default Header;
