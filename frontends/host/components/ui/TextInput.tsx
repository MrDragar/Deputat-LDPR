import React, { useEffect, useRef } from 'react';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'onChange' | 'onBlur'> {
    label?: string;
    name: string;
    id?: string;
    error?: string;
    required?: boolean;
    type?: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'password' | 'date';
    value: string | number | readonly string[] | undefined;
    onChange: (name: string, value: string) => void;
    onBlur?: (name: string) => void;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const TextInput: React.FC<TextInputProps> = ({ label, name, id, error, required, type = 'text', value, onChange, onBlur, icon, rightIcon, className, ...props }) => {
    
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (type === 'textarea' && textAreaRef.current) {
            const el = textAreaRef.current;
            el.style.height = 'auto'; // Reset height
            el.style.height = `${el.scrollHeight}px`; // Set to scroll height
        }
    }, [value, type]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(name, e.target.value);
    };
    
    const handleBlur = () => {
        if (onBlur) {
            onBlur(name);
        }
    };

    const paddingClasses = `${icon ? 'pl-12' : 'pl-4'} ${rightIcon ? 'pr-12' : 'pr-4'}`;

    const inputClasses = `
        w-full py-3 border rounded-lg shadow-sm bg-white/50
        text-gray-900 placeholder-gray-500 
        focus:outline-none focus:ring-2
        ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
        transition duration-200 ease-in-out text-base
        ${paddingClasses}
        ${className}
    `;

    return (
        <div>
            {label && (
                <label htmlFor={id || name} className="block text-base font-semibold text-gray-800 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        {icon}
                    </div>
                )}
                {type === 'textarea' ? (
                    <textarea
                        ref={textAreaRef}
                        id={id || name}
                        name={name}
                        className={`${inputClasses} resize-none max-h-60 overflow-y-hidden`}
                        value={value}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        rows={1}
                        required={required}
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
                        required={required}
                        {...props as React.InputHTMLAttributes<HTMLInputElement>}
                    />
                )}
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default React.memo(TextInput);