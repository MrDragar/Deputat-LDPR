import React, { useCallback } from 'react';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'onChange' | 'onBlur'> {
    label?: string;
    name: string;
    id?: string;
    error?: string;
    required?: boolean;
    format?: 'capitalizeName';
    type?: 'text' | 'email' | 'tel' | 'url' | 'textarea';
    value: string | number | readonly string[] | undefined;
    onChange: (name: string, value: string) => void;
    onBlur?: (name: string) => void;
}

const TextInput: React.FC<TextInputProps> = ({ label, name, id, error, required, format, type = 'text', value, onChange, onBlur, ...props }) => {
    const formatValue = (val: string) => {
        if (format === 'capitalizeName' && val) {
            return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        }
        return val;
    };

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const formattedValue = formatValue(e.target.value);
        onChange(name, formattedValue);
    }, [name, onChange, format]);
    
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
            {label && (
                <label htmlFor={id || name} className="block text-base font-semibold text-gray-800 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            {type === 'textarea' ? (
                <textarea
                    id={id || name}
                    name={name}
                    className={`${inputClasses} min-h-[100px]`}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
                />
            ) : (
                <input
                    id={id || name}
                    name={name}
                    type={type}
                    className={inputClasses}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    {...props as React.InputHTMLAttributes<HTMLInputElement>}
                />
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default React.memo(TextInput);