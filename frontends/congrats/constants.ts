
import type { RadioOption } from './types';
import { User, Building, Mars, Venus } from 'lucide-react';


export const ENTITY_TYPE_OPTIONS: RadioOption[] = [
  { value: 'individual', label: 'Физическое лицо', icon: User },
  { value: 'legal_entity', label: 'Юридическое лицо', icon: Building },
];

export const GENDER_OPTIONS: RadioOption[] = [
  { value: 'male', label: 'Мужской', icon: Mars },
  { value: 'female', label: 'Женский', icon: Venus },
];