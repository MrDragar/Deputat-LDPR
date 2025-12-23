
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
            return val.charAt(0).toUpperCase() + val.slice(1);
        }
        return val;
    };

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let val = e.target.value;
        
        // Prevent leading space
        if (val.startsWith(' ')) return;

        const formattedValue = formatValue(val);
        onChange(name, formattedValue);
    }, [name, onChange, format]);
    
    const handleBlur = useCallback(() => {
        if (onBlur) {
            onBlur(name);
        }
    }, [name, onBlur]);

    const inputClasses = `
        w-full px-4 py-3 border rounded-md bg-white
        text-gray-900 placeholder-gray-400 
        focus-visible:outline-none focus-visible:ring-2
        ${error ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : 'border-gray-300 focus-visible:ring-blue-500 focus-visible:border-blue-500'}
        transition duration-150 ease-in-out text-base
    `;

    const commonProps = {
        id: id || name,
        name,
        value: value ?? '',
        required,
        onChange: handleChange,
        onBlur: handleBlur,
        ...props,
    };

    return (
        <div>
            {label && (
                <label htmlFor={id || name} className="block text-base font-semibold text-gray-800 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            {type === 'textarea' ? (
                <textarea
                    {...commonProps}
                    className={`${inputClasses} min-h-[100px]`}
                />
            ) : (
                <input
                    {...commonProps}
                    type={type}
                    className={inputClasses}
                />
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default React.memo(TextInput);
