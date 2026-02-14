// FIX: `subDays` was not found in the main export, so it's imported directly from its subpath.
import { addDays, format } from 'date-fns';
import subDays from 'date-fns/subDays';

export type PartyImage =
  | 'Перемены после СВО'
  | 'Державность'
  | 'Наследие';

export interface PlanEventDetails {
  [key: string]: string | undefined;
}

export interface PlanEvent {
  id: number;
  partyImage: PartyImage; // Бывшая тема/категория
  title: string;
  isInfostrike: boolean;
  details: PlanEventDetails;
}

export interface DailyPlan {
  id?: number; // Server-side ID
  date: string; // YYYY-MM-DD
  holidays: string[];
  events: PlanEvent[];
}

export const partyImageConfig: Record<PartyImage, { label: string; colors: { bg: string; text: string } }> = {
  'Перемены после СВО': { 
    label: 'Перемены после СВО', 
    colors: { bg: 'bg-[#01B04E]', text: 'text-[#01B04E]' } 
  },
  'Державность': { 
    label: 'Державность', 
    colors: { bg: 'bg-[#6E349B]', text: 'text-[#6E349B]' } 
  },
  'Наследие': { 
    label: 'Наследие', 
    colors: { bg: 'bg-[#EC7E34]', text: 'text-[#EC7E34]' } 
  },
};

export const partyImageOptions = Object.entries(partyImageConfig).map(([value, { label }]) => ({
    value: value as PartyImage,
    label: label,
}));

// Хранилище данных. Сейчас пустое, готовое к наполнению.
export const initialFederalPlanData: DailyPlan[] = [];