import React from 'react';

interface LanguageProficiencyProps {
  name: string;
  level: string;
}

/**
 * Maps language proficiency levels from string to a percentage and a display label.
 * This is designed to be easily adaptable if the level names from the API change.
 * @param {string} level - The proficiency level string from the API.
 * @returns {{percentage: number, label: string}} - The calculated percentage and a user-friendly label.
 */
const getProficiencyDetails = (level: string): { percentage: number; label: string } => {
  if (!level) {
    return { percentage: 0, label: 'Не указан' };
  }

  const normalizedLevel = level.toLowerCase().trim();

  switch (normalizedLevel) {
    case 'читаю и перевожу со словарем':
      return { percentage: 33, label: level };
    case 'читаю и могу объясняться':
      return { percentage: 66, label: level };
    case 'свободно владею':
      return { percentage: 100, label: level };
    default:
      // Fallback for any other unknown levels. 
      // Using a low percentage to indicate it's an unmapped value.
      return { percentage: 10, label: level };
  }
};


const LanguageProficiency: React.FC<LanguageProficiencyProps> = ({ name, level }) => {
  const { percentage, label } = getProficiencyDetails(level);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <p className="font-semibold text-gray-800 text-base">{name}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Уровень владения языком ${name}: ${label}`}
        ></div>
      </div>
    </div>
  );
};

export default LanguageProficiency;