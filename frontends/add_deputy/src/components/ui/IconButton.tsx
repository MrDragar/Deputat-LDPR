import React from 'react';
import type { LucideProps } from 'lucide-react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ElementType<LucideProps>;
}

const IconButton: React.FC<IconButtonProps> = ({ icon: Icon, className, ...props }) => {
    return (
        <button
            type="button"
            className={`flex-shrink-0 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
            {...props}
        >
            <Icon className="h-5 w-5" />
        </button>
    );
};

export default IconButton;