import React from 'react';

interface ToggleButtonOption {
    label: string;
    value: string;
    color: string;
}

interface ToggleButtonGroupProps {
    title?: string;
    options: ToggleButtonOption[];
    selectedOptions: string[];
    onChange: (value: string) => void;
}

export const ToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({ title, options, selectedOptions, onChange }) => {
    return (
        <div>
            {title && <label className="text-sm font-semibold mb-2 text-brand-on-surface-primary block">{title}</label>}
            <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
                {options.map(({ label, value, color }) => {
                    const isSelected = selectedOptions.includes(value);
                    return (
                        <button
                            key={value}
                            onClick={() => onChange(value)}
                            aria-pressed={isSelected}
                            style={isSelected ? { backgroundColor: color } : {}}
                            className={`w-full text-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
                                isSelected
                                    ? 'text-white shadow'
                                    : 'text-brand-on-surface-secondary hover:bg-gray-200'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};