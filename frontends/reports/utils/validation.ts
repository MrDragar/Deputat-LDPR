
import type { FormData, LegislationItem, ProjectActivityItem, LdprOrderItem } from '../types';

// Strict URL Regex: Must start with http:// or https://, then at least one non-whitespace character. No spaces allowed.
// We relax the regex slightly to allow http as well, per user request.
export const URL_REGEX = /^https?:\/\/[^\s]+$/;
const DATE_REGEX = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19|20)\d{2}$/;

// Helper to validate simple numbers
const isNumeric = (val: string) => /^\d+$/.test(val);

export const validateField = (path: string, allData: FormData): string | undefined => {
    // General Info Validations
    if (path === 'general_info.full_name') return allData.general_info.full_name ? undefined : 'Это поле обязательно';
    if (path === 'general_info.district') return allData.general_info.district ? undefined : 'Это поле обязательно';
    if (path === 'general_info.region') return allData.general_info.region ? undefined : 'Это поле обязательно';
    if (path === 'general_info.representative_level') return allData.general_info.representative_level ? undefined : 'Это поле обязательно';
    if (path === 'general_info.authority_name') return allData.general_info.authority_name ? undefined : 'Это поле обязательно';
    if (path === 'general_info.position') return allData.general_info.position ? undefined : 'Это поле обязательно';
    if (path === 'general_info.ldpr_position') return allData.general_info.ldpr_position ? undefined : 'Это поле обязательно';
    
    if (path === 'general_info.term_start') {
        const val = allData.general_info.term_start;
        if (!val) return 'Это поле обязательно';
        if (!DATE_REGEX.test(val)) return 'Неверный формат (ДД.ММ.ГГГГ)';
        return undefined;
    }

    if (path === 'general_info.term_end') {
        const val = allData.general_info.term_end;
        if (!val) return 'Это поле обязательно';
        if (!DATE_REGEX.test(val)) return 'Неверный формат (ДД.ММ.ГГГГ)';
        return undefined;
    }

    // Sessions Statistics
    if (path.startsWith('general_info.sessions_attended.')) {
        const key = path.split('.').pop() as keyof typeof allData.general_info.sessions_attended;
        const val = allData.general_info.sessions_attended[key];
        if (!val) return 'Обязательно';
        if (!isNumeric(val)) return 'Только цифры';
        
        // Check Logic: Attended <= Total
        const { total, attended, committee_total, committee_attended, ldpr_total, ldpr_attended } = allData.general_info.sessions_attended;
        
        // Convert to numbers for comparison, treating empty strings as 0 to avoid false positives during typing
        const numVal = parseInt(val) || 0;
        
        if (key === 'attended' && total) {
             if (numVal > parseInt(total)) return 'Не может быть больше общего';
        }
        if (key === 'committee_attended' && committee_total) {
             if (numVal > parseInt(committee_total)) return 'Не может быть больше общего';
        }
        if (key === 'ldpr_attended' && ldpr_total) {
             if (numVal > parseInt(ldpr_total)) return 'Не может быть больше общего';
        }
        
        return undefined;
    }

    // Citizen Requests Stats - Strictly Required
    if (path === 'citizen_requests.personal_meetings') {
        const val = allData.citizen_requests.personal_meetings;
        if (!val) return 'Обязательно';
        if (!isNumeric(val)) return 'Только цифры';
        return undefined;
    }
    if (path === 'citizen_requests.responses') {
        const val = allData.citizen_requests.responses;
        if (!val) return 'Обязательно';
        if (!isNumeric(val)) return 'Только цифры';
        return undefined;
    }
    if (path === 'citizen_requests.official_queries') {
        const val = allData.citizen_requests.official_queries;
        if (!val) return 'Обязательно';
        if (!isNumeric(val)) return 'Только цифры';
        return undefined;
    }
    
    // Request Topics - Strictly Required (at least 0)
    if (path.startsWith('citizen_requests.requests.')) {
        const key = path.split('.').pop();
        const val = (allData.citizen_requests.requests as any)[key!];
        if (val === undefined || val === '') return 'Обязательно';
        if (!isNumeric(val)) return 'Только цифры';
        return undefined;
    }
    
    return undefined;
};

export const validateLegislationItem = (item: LegislationItem): string | undefined => {
    if (!item.title) return 'Название обязательно';
    if (!item.summary) return 'Описание обязательно';
    if (!item.status) return 'Статус обязателен';
    if (item.status === 'Отклонено' && !item.rejection_reason) return 'Укажите причину отказа';
    return undefined;
};

export const validateProjectItem = (item: ProjectActivityItem): string | undefined => {
    if (!item.name) return 'Наименование обязательно';
    if (!item.result) return 'Результат обязателен';
    return undefined;
};

export const validateLdprOrder = (item: LdprOrderItem): string | undefined => {
    if (!item.instruction) return 'Поручение обязательно';
    if (!item.action) return 'Проделанная работа обязательна';
    return undefined;
};

// Helper for validating a single link string
export const validateLinkString = (link: string): string | undefined => {
    if (!link) return undefined; 
    if (!URL_REGEX.test(link)) return 'Ссылка должна начинаться с http:// или https:// (например: https://example.com)';
    return undefined;
};