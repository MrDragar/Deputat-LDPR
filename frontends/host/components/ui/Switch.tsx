import React from 'react';

interface SwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const Switch: React.FC<SwitchProps> = ({ id, checked, onChange, label }) => {
  const handleToggle = () => {
    onChange(!checked);
  };

  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={handleToggle}
        />
        <div className={`block w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        <div
          className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
            checked ? 'transform translate-x-5' : ''
          }`}
        ></div>
      </div>
      <div className="ml-3 font-medium text-gray-700">{label}</div>
    </label>
  );
};

export default Switch;