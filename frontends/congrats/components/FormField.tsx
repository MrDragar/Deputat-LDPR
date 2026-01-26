import React from 'react';

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ id, name, label, type = 'text', value, onChange, onBlur, onFocus, placeholder, className }) => {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors"
      />
    </div>
  );
};

export default FormField;
