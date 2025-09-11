import React, { useCallback } from 'react';

interface RadioGroupProps {
    label: string;
    name: string;
    options: string[];
    selected: string;
    onChange: (name: string, value: string) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ label, name, options, selected, onChange }) => {
    const handleChange = useCallback((value: string) => {
        onChange(name, value);
    }, [name, onChange]);
    
    return (
        <div>
            <label className="block text-base font-semibold text-gray-800 mb-3">{label}</label>
            <div className="flex flex-wrap gap-3">
                {options.map(option => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => handleChange(option)}
                        className={`
                            px-5 py-2.5 text-base font-medium rounded-md border
                            transition-colors duration-150
                            ${selected === option 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }
                        `}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default React.memo(RadioGroup);
