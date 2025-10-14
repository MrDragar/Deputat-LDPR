import type { FormData, OtherLink } from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+7\d{10}$/;
const DATE_REGEX = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19|20)\d{2}$/;
// Updated regex to support Cyrillic domains and require a protocol
export const URL_REGEX = /^https?:\/\/([a-zA-Z0-9\u0400-\u04FF.-]+)\.([a-zA-Z\u0400-\u04FF]{2,})([\/\w .-]*)*\/?$/;


export const validateField = (name: keyof FormData, allData: FormData): string | undefined => {
    const value = allData[name];

    switch (name) {
        case 'lastName':
        case 'firstName':
            return value ? undefined : 'Это поле обязательно для заполнения';
        case 'email':
            if (!value) return 'Это поле обязательно для заполнения';
            return EMAIL_REGEX.test(value as string) ? undefined : 'Неверный формат email';
        case 'phone':
            if (!value) return 'Это поле обязательно для заполнения';
            return PHONE_REGEX.test(value as string) ? undefined : 'Неверный формат телефона. Пример: +79991234567';
        case 'birthDate':
            if (!value) return 'Это поле обязательно для заполнения';
            if (!DATE_REGEX.test(value as string)) return 'Неверный формат даты. Пример: 20.08.1990';
            const [day, month, year] = (value as string).split('.').map(Number);
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
                return 'Некорректная дата';
            }
            return undefined;
        case 'region':
        case 'maritalStatus':
        case 'childrenCount':
        case 'partyExperience':
        case 'partyPosition':
        case 'partyRole':
        case 'representativeBodyName':
        case 'representativeBodyLevel':
        case 'representativeBodyPosition':
        case 'committeeName':
        case 'committeeStatus':
            return value ? undefined : 'Это поле обязательно для заполнения';
        case 'partyRoleOther':
            if (allData.partyRole === 'Другая' && !value) {
                return 'Это поле обязательно для заполнения';
            }
            return undefined;
        case 'vkPage':
             if (!value) return 'Это поле обязательно для заполнения';
             return URL_REGEX.test(value as string) ? undefined : 'Неверный формат ссылки. Пример: https://vk.com/username';
        case 'vkGroup':
            return !(value as string) || URL_REGEX.test(value as string) ? undefined : 'Неверный формат ссылки. Пример: https://vk.com/groupname';
        case 'telegramChannel':
            return !(value as string) || URL_REGEX.test(value as string) ? undefined : 'Неверный формат ссылки. Пример: https://t.me/channelname';
        case 'personalSite':
            return !(value as string) || URL_REGEX.test(value as string) ? undefined : 'Неверный формат ссылки. Пример: https://example.com';
        
        case 'childrenFemaleCount':
        case 'childrenMaleCount': {
            const total = parseInt(allData.childrenCount, 10) || 0;
            const male = parseInt(allData.childrenMaleCount, 10) || 0;
            const female = parseInt(allData.childrenFemaleCount, 10) || 0;
            if (total > 0 && male + female > total) {
                return 'Сумма мальчиков и девочек не может превышать общее количество детей.';
            }
            if (total > 0 && allData.childrenMaleCount && allData.childrenFemaleCount && male + female !== total) {
                return 'Сумма мальчиков и девочек должна быть равна общему количеству детей.';
            }
            return undefined;
        }

        case 'underageChildrenFemaleCount':
        case 'underageChildrenMaleCount': {
             const totalUnderage = parseInt(allData.underageChildrenCount, 10) || 0;
             const maleUnderage = parseInt(allData.underageChildrenMaleCount, 10) || 0;
             const femaleUnderage = parseInt(allData.underageChildrenFemaleCount, 10) || 0;
             if (totalUnderage > 0 && maleUnderage + femaleUnderage > totalUnderage) {
                 return 'Сумма несовершеннолетних мальчиков и девочек не может превышать общее количество несовершеннолетних детей.';
             }
             if (totalUnderage > 0 && allData.underageChildrenMaleCount && allData.underageChildrenFemaleCount && maleUnderage + femaleUnderage !== totalUnderage) {
                return 'Сумма несовершеннолетних мальчиков и девочек должна быть равна общему количеству несовершеннолетних детей.';
            }
             const maleTotal = parseInt(allData.childrenMaleCount, 10) || 0;
             if (maleTotal > 0 && maleUnderage > maleTotal) {
                 return 'Несовершеннолетних мальчиков не может быть больше, чем всего мальчиков.';
             }
             const femaleTotal = parseInt(allData.childrenFemaleCount, 10) || 0;
             if (femaleTotal > 0 && femaleUnderage > femaleTotal) {
                 return 'Несовершеннолетних девочек не может быть больше, чем всего девочек.';
             }
             return undefined;
        }

        case 'underageChildrenCount': {
            const total = parseInt(allData.childrenCount, 10) || 0;
            if (total > 0 && !value) {
                return 'Это поле обязательно для заполнения';
            }
            const underage = parseInt(allData.underageChildrenCount, 10) || 0;
            if (total > 0 && underage > total) {
                return 'Несовершеннолетних детей не может быть больше, чем общее количество детей.';
            }
            return undefined;
        }
        
        case 'additionalInfo':
        case 'suggestions':
        case 'talents':
        case 'knowledgeToShare':
        case 'superpower':
            return value ? undefined : 'Это поле обязательно для заполнения';
        
        case 'professionalSphere':
            return (value as string[]).length === 4 ? undefined : 'Необходимо выбрать ровно 4 варианта';
        case 'sports':
        case 'recreation':
        case 'hobbies':
        case 'ldprResources':
        case 'knowledgeGaps':
            return (value as string[]).length > 0 ? undefined : 'Необходимо выбрать хотя бы один вариант.';

        default:
            return undefined;
    }
};