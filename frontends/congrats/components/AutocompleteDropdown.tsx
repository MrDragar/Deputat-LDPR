import React from 'react';
import type { SenderPreset } from '../types';

interface AutocompleteDropdownProps {
  presets: SenderPreset[];
  onSelect: (preset: SenderPreset) => void;
  className?: string;
}

const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({ presets, onSelect, className }) => {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div className={`absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      <ul className="py-1 max-h-60 overflow-auto">
        {presets.map((preset, index) => (
          <li
            key={index}
            onMouseDown={(e) => { // Use onMouseDown to prevent blur from firing before click
              e.preventDefault();
              onSelect(preset)
            }}
            className="px-4 py-2 text-gray-800 cursor-pointer hover:bg-brand-light transition-colors"
          >
            {preset.lastName} {preset.firstName} {preset.middleName}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AutocompleteDropdown;
