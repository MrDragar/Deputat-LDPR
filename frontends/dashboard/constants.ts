
import type { DeputyType } from './types';

export const DATE_FILTERS = [
    "Январь (1)", "Февраль (1)", "Март (1)", "Апрель (1)", 
    "Май (1)", "Июнь (1)", "Июль (1)", "Август (1)", 
    "Август (2)", "Сентябрь (1)"
];

export const DEPUTY_TYPE_FILTERS: { label: string; value: DeputyType; color: string; }[] = [
    { label: 'ЗС', value: 'zs', color: '#3E66F4' },
    { label: 'АЦС', value: 'acs', color: '#8B5CF6' },
    { label: 'ОМСУ', value: 'omsu', color: '#F97316' }
];

export const UI_COLORS = {
    primary: '#3E66F4',
    secondary: '#2842D5',
    background: '#F5F8FA',
    surface: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onSurfacePrimary: '#1A202C',
    onSurfaceSecondary: '#718096',
    positive: '#48BB78',
    negative: '#E53E3E',
    chartBlue: '#63B3ED',
    chartGray: '#A0AEC0',
};