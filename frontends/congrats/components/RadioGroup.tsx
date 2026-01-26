
import React from 'react';
import type { RadioOption } from '../types';

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ name, options, selectedValue, onChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedValue === option.value;
        return (
          <div key={option.value}>
            <input
              type="radio"
              id={`${name}_${option.value}`}
              name={name}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <label
              htmlFor={`${name}_${option.value}`}
              className={`cursor-pointer p-4 flex items-center gap-4 rounded-lg border-2 transition-all duration-200 ease-in-out
                ${
                  isSelected
                    ? 'bg-brand-primary border-brand-primary text-white'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-dark'
                }`}
            >
              <Icon className={`h-6 w-6 transition-colors ${isSelected ? '' : 'text-gray-400'}`} />
              <span className={`font-semibold transition-colors ${isSelected ? '' : 'text-gray-600'}`}>
                {option.label}
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
};

export default RadioGroup;
