import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TextInputProps {
  label?: string;
  name: string;
  id?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'url';
  value: string | number;
  onChange: (name: string, value: string) => void;
  onBlur?: (name: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  rows?: number;
  min?: number;
  max?: number;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  name,
  id,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required,
  icon,
  rows = 3,
  min,
  max
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(name, e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(name);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (type === 'textarea') {
      adjustTextareaHeight();
    }
  }, [value, type, adjustTextareaHeight]);

  const inputId = id || name;
  const baseInputClasses = `w-full px-4 py-3 text-base text-gray-900 bg-white border rounded-md shadow-sm outline-none transition-colors duration-200
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
    ${icon ? 'pl-11' : ''}
    ${isFocused ? 'ring-1' : ''}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-base font-semibold text-gray-800 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            {icon}
          </div>
        )}
        {type === 'textarea' ? (
          <textarea
            ref={textareaRef}
            id={inputId}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            required={required}
            rows={rows}
            className={`${baseInputClasses} resize-none overflow-hidden`}
          />
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={placeholder}
            required={required}
            min={min}
            max={max}
            className={baseInputClasses}
          />
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default React.memo(TextInput);
