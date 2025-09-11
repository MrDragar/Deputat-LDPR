import React, { useCallback } from 'react';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
    label: string;
    name: string;
    id?: string;
    error?: string;
    required?: boolean;
    value: string | number | readonly string[] | undefined;
    onChange: (name: string, value: string) => void;
    onBlur?: (name: string) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, name, id, error, required, value, onChange, onBlur, ...props }) => {
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow only digits
        if (/^\d*$/.test(val)) {
            onChange(name, val);
        }
    }, [name, onChange]);

    const handleBlur = useCallback(() => {
        if (onBlur) {
            onBlur(name);
        }
    }, [name, onBlur]);
    
    const inputClasses = `
        w-full px-4 py-3 border rounded-md shadow-sm bg-white
        text-gray-900 placeholder-gray-400 
        focus:outline-none focus:ring-2
        ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
        transition duration-150 ease-in-out text-base
    `;

    return (
        <div>
            <label htmlFor={id || name} className="block text-base font-semibold text-gray-800 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                id={id || name}
                name={name}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={inputClasses}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                {...props}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default React.memo(NumberInput);
