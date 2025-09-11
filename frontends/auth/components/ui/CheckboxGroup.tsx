import React, { useCallback, useState } from 'react';
import TextInput from './TextInput';
import { X } from 'lucide-react';

interface CheckboxGroupProps {
    label: string;
    name: string;
    options: string[];
    selectedOptions: string[];
    onChange: (name: string, selected: string[]) => void;
    conditionalField?: {
        trigger: string;
        label: string;
        name: string;
        value: string;
        onChange: (name: string, value: string) => void;
        required?: boolean;
        placeholder?: string;
    };
    maxSelections?: number;
    error?: string;
    helperText?: string;
    customOptions?: string[];
    onAddCustomOption?: (option: string) => void;
    onRemoveCustomOption?: (option: string) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    label,
    name,
    options,
    selectedOptions,
    onChange,
    conditionalField,
    maxSelections,
    error,
    helperText,
    customOptions = [],
    onAddCustomOption,
    onRemoveCustomOption,
}) => {
    const [customValue, setCustomValue] = useState('');

    const handleToggle = useCallback((option: string) => {
        const isSelected = selectedOptions.includes(option);
        if (!isSelected && maxSelections && selectedOptions.length >= maxSelections) {
            return;
        }

        const newSelected = isSelected
            ? selectedOptions.filter(item => item !== option)
            : [...selectedOptions, option];
        onChange(name, newSelected);
    }, [name, onChange, selectedOptions, maxSelections]);

    const handleAddCustom = useCallback(() => {
        if (customValue.trim() && onAddCustomOption) {
            onAddCustomOption(customValue.trim());
            setCustomValue('');
        }
    }, [customValue, onAddCustomOption]);
    
    const handleRemoveCustom = useCallback((option: string) => {
        if (onRemoveCustomOption) {
            onRemoveCustomOption(option);
        }
    }, [onRemoveCustomOption]);

    const checkmarkSvg = "data:image/svg+xml,%3csvg viewBox='0 0 24 24' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m9.707 19.121c-.187.188-.442.293-.707.293s-.52-.105-.707-.293l-5.646-5.647c-.586-.586-.586-1.536 0-2.121l.707-.707c.586-.586 1.535-.586 2.121 0l3.525 3.525 9.525-9.525c.586-.586 1.536-.586 2.121 0l.707.707c.586.586.586 1.536 0 2.121z'/%3e%3c/svg%3e";
    const showCustomInput = selectedOptions.includes('Другое');

    const renderCheckbox = (option: string, isCustom = false) => {
        const isChecked = selectedOptions.includes(option);
        const isLimitReached = maxSelections !== undefined && selectedOptions.length >= maxSelections;
        const isDisabled = !isChecked && isLimitReached;

        return (
            <div key={option} className={`flex items-start ${isCustom ? 'justify-between' : ''}`}>
                <label htmlFor={`checkbox-${label}-${option}`} className={`flex items-start flex-grow ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                        id={`checkbox-${label}-${option}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(option)}
                        disabled={isDisabled}
                        className={`appearance-none h-5 w-5 border rounded-sm bg-white mt-0.5
                                   shrink-0
                                   transition duration-150 ease-in-out
                                   ${isDisabled
                                        ? 'border-gray-300 bg-gray-100'
                                        : `border-gray-400 checked:bg-blue-600 checked:border-transparent 
                                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`
                                    }`}
                        style={!isDisabled ? { backgroundImage: `url("${checkmarkSvg}")`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: '100%' } : {}}
                    />
                    <span className={`ml-3 text-base font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`}>{option}</span>
                </label>
                {isCustom && (
                    <button
                        type="button"
                        onClick={() => handleRemoveCustom(option)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors ml-2 shrink-0"
                        aria-label={`Удалить опцию ${option}`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div>
            <label className={`block text-base font-semibold text-gray-800 ${maxSelections || helperText ? 'mb-1' : 'mb-3'}`}>{label}</label>
            {helperText ? (
                <p className="text-sm text-gray-500 mb-3">{helperText}</p>
            ) : maxSelections ? (
                 <p className="text-sm text-gray-500 mb-3">Выберите не более {maxSelections} вариантов. ({selectedOptions.length}/{maxSelections})</p>
            ) : null}

            <div className="flex flex-col gap-3">
                {options.map(option => renderCheckbox(option))}
                {customOptions.map(option => renderCheckbox(option, true))}
            </div>

            {showCustomInput && (
                <div className="mt-4 flex items-center gap-2">
                    <div className="flex-grow">
                        <TextInput 
                            name={`${name}CustomInput`}
                            value={customValue}
                            onChange={(_, val) => setCustomValue(val)}
                            placeholder="Введите свой вариант..."
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleAddCustom}
                        disabled={!customValue.trim()}
                        className="px-6 py-3 text-base font-semibold rounded-lg transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Добавить
                    </button>
                </div>
            )}
            
            {conditionalField && selectedOptions.includes(conditionalField.trigger) && (
                 <div className="mt-3">
                    <TextInput
                        label={conditionalField.label}
                        name={conditionalField.name}
                        value={conditionalField.value}
                        onChange={conditionalField.onChange}
                        required={conditionalField.required}
                        placeholder={conditionalField.placeholder}
                    />
                 </div>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default React.memo(CheckboxGroup);
