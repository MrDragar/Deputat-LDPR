import React from 'react';

interface EmptyStatePlaceholderProps {
    imageUrl: string;
}

const EmptyStatePlaceholder: React.FC<EmptyStatePlaceholderProps> = ({ imageUrl }) => {
    return (
        <div className="flex items-start justify-center rounded-lg mb-6">
             <img 
                src={imageUrl} 
                alt="Иллюстрация" 
                className="max-w-md w-full h-auto object-contain"
            />
        </div>
    );
};

export default EmptyStatePlaceholder;
