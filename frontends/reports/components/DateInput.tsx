import React, { useCallback } from 'react';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
    label: string;
    name: string;
    id?: string;
    error?: string;
    required?: boolean;
    value: string | number | readonly string[] | undefined;
    onChange: (name: string, value: string) => void;
    onBlur?: (name: string) => void;
}

const DateInput: React.FC<DateInputProps> = ({ label, name, id, error, required, value, onChange, onBlur, ...props }) => {

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 8) val = val.slice(0, 8);

        if (val.length > 4) {
            val = `${val.slice(0, 2)}.${val.slice(2, 4)}.${val.slice(4)}`;
        } else if (val.length > 2) {
            val = `${val.slice(0, 2)}.${val.slice(2)}`;
        }
        
        onChange(name, val);
    }, [name, onChange]);

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

    return (
        <div>
            <label htmlFor={id || name} className="block text-base font-semibold text-gray-800 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                id={id || name}
                name={name}
                type="text"
                className={inputClasses}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="ДД.ММ.ГГГГ"
                maxLength={10}
                {...props}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default React.memo(DateInput);