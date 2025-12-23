
import React, { useState } from 'react';
import { Link, Plus, Trash2 } from 'lucide-react';
import { validateLinkString } from '../utils/validation';

interface LinkInputListProps {
    links: string[];
    onChange: (newLinks: string[]) => void;
    label?: string;
    addButtonLabel?: string;
    placeholder?: string;
}

const LinkInputList: React.FC<LinkInputListProps> = ({ 
    links, 
    onChange, 
    label = "Ссылки", 
    addButtonLabel = "Добавить ссылку",
    placeholder = "https://..."
}) => {
    const [touched, setTouched] = useState<Record<number, boolean>>({});

    const handleChange = (index: number, value: string) => {
        // Prevent leading space
        if (value.startsWith(' ')) return;
        
        // Reset touched state for this index when user starts typing
        // This ensures the error disappears immediately while they fix it
        setTouched(prev => {
            const next = { ...prev };
            delete next[index]; 
            return next; 
        });

        const newLinks = [...links];
        newLinks[index] = value;
        onChange(newLinks);
    };

    const handleBlur = (index: number) => {
        setTouched(prev => ({ ...prev, [index]: true }));
    };

    const handleAdd = () => {
        onChange([...links, '']);
    };

    const handleRemove = (index: number) => {
        const newLinks = links.filter((_, i) => i !== index);
        onChange(newLinks);
        
        // Clean up touched state
        setTouched(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    };

    return (
        <div className="space-y-3">
            {label && <label className="block text-base font-semibold text-gray-800">{label}</label>}
            
            <div className="space-y-3">
                {links.map((link, index) => {
                    const isTouched = touched[index];
                    const error = validateLinkString(link);
                    const showError = isTouched && error;

                    return (
                        <div key={index} className="space-y-1">
                            <div className="flex items-center gap-2 group">
                                <div className="relative flex-grow">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <Link className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="url"
                                        value={link}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onBlur={() => handleBlur(index)}
                                        placeholder={placeholder}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-md bg-white text-gray-900 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 transition duration-150 ease-in-out text-base ${showError ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500'}`}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                    aria-label="Удалить ссылку"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                            {showError && <p className="text-xs text-red-600 pl-1">{error}</p>}
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={handleAdd}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
            >
                <Plus className="h-4 w-4" />
                {addButtonLabel}
            </button>
        </div>
    );
};

export default React.memo(LinkInputList);
