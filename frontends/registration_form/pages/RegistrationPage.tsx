// FIX: Corrected the import for React hooks. The original import was syntactically incorrect, causing widespread "Cannot find name" errors.
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Check, ArrowLeft, ArrowRight, User, Phone, GraduationCap, Languages, Briefcase, Heart, Flag, Users, ClipboardList, Palette, MessageCircle, FilePlus2, AlertTriangle } from 'lucide-react';
import { initialFormData } from '../constants';
import type { FormData, Education, WorkExperience, SocialOrganization, OtherLink, Language } from '../types';
import TextInput from '../components/TextInput';
import RadioGroup from '../components/RadioGroup';
import SearchableSelect from '../components/SearchableSelect';
import Select from '../components/Select';
import CheckboxGroup from '../components/CheckboxGroup';
import NumberInput from '../components/NumberInput';
import DateInput from '../components/DateInput';
import EmptyStatePlaceholder from '../components/EmptyStatePlaceholder';
import ConfirmationModal from '../components/ConfirmationModal';
import BottomSheet from '../components/BottomSheet';
import SuccessPage from './SuccessPage';
import { REGIONS, EDUCATION_LEVELS, REPRESENTATIVE_BODY_LEVELS, COMMITTEE_STATUSES, SPORTS, RECREATION, HOBBIES, LDPR_RESOURCES, KNOWLEDGE_GAPS, FOREIGN_LANGUAGES, RUSSIAN_FEDERATION_LANGUAGES, LANGUAGE_LEVELS, PROFESSIONAL_SPHERES, POSTGRADUATE_TYPES, DEGREE_TYPES, TITLE_TYPES, PARTY_ROLES } from '../constants';
import { validateField, URL_REGEX } from '../utils/validation';

// Section definitions
const SECTIONS = [
    { title: "Основная информация", fields: ['lastName', 'firstName', 'middleName', 'gender', 'birthDate', 'region'] },
    { title: "Контактная информация", fields: ['phone', 'email', 'vkPage', 'vkGroup', 'telegramChannel', 'personalSite', 'otherLinks'] },
    { title: "Образование", fields: ['education'] },
    { title: "Языки", fields: ['foreignLanguages', 'russianFederationLanguages'] },
    { title: "Работа", fields: ['workExperience'] },
    { title: "Семья", fields: ['maritalStatus', 'childrenCount', 'childrenMaleCount', 'childrenFemaleCount', 'underageChildrenCount', 'underageChildrenMaleCount', 'underageChildrenFemaleCount'] },
    { title: "Партийная деятельность", fields: ['partyExperience', 'partyPosition', 'partyRole', 'partyRoleOther'] },
    { title: "Общественная деятельность", fields: ['representativeBodyName', 'representativeBodyLevel', 'representativeBodyPosition', 'committeeName', 'committeeStatus', 'socialOrganizations'] },
    { title: "Профессиональная деятельность", fields: ['professionalSphere', 'awards'] },
    { title: "Увлечения и интересы", fields: ['sports', 'recreation', 'hobbies'] },
    { title: "Обратная связь", fields: ['ldprResources', 'centralOfficeAssistant', 'knowledgeGaps'] },
    { title: "Дополнительная информация", fields: ['additionalInfo', 'suggestions', 'talents', 'knowledgeToShare', 'superpower'] }
];
const BASE_URL = import.meta.env.VITE_FRONTEND_AUTH_HOST || 'http://localhost:8000';

const STEP_ICONS = [
    User, Phone, GraduationCap, Languages, Briefcase, Heart, Flag, Users, 
    ClipboardList, Palette, MessageCircle, FilePlus2
];

const FORM_DATA_KEY = 'ldpr_form_data';
const FORM_STEP_KEY = 'ldpr_form_step';
const FORM_COMPLETED_KEY = 'ldpr_form_completed';
const FORM_SUBMITTED_KEY = 'ldpr_form_submitted';


// Helper validation functions for dynamic list items
const validateEducationItemField = (field: keyof Education, item: Education): string | undefined => {
    switch (field) {
        case 'level': return item.level ? undefined : 'Это поле обязательно для заполнения';
        case 'organization': return item.organization ? undefined : 'Это поле обязательно для заполнения';
        case 'postgraduateType': return item.hasPostgraduate === 'Да' && !item.postgraduateType ? 'Выберите вид образования' : undefined;
        case 'postgraduateOrganization': return item.hasPostgraduate === 'Да' && item.postgraduateType && !item.postgraduateOrganization ? 'Это поле обязательно для заполнения' : undefined;
        case 'degreeType': return item.hasDegree === 'Да' && !item.degreeType ? 'Выберите ученую степень' : undefined;
        case 'titleType': return item.hasTitle === 'Да' && !item.titleType ? 'Выберите ученое звание' : undefined;
        default: return undefined;
    }
};

const validateWorkItemField = (field: keyof WorkExperience, item: WorkExperience): string | undefined => {
    return item[field] ? undefined : 'Это поле обязательно для заполнения';
};

const validateLanguageItemField = (field: keyof Language, item: Language): string | undefined => {
    return field === 'name' && !item.name ? 'Это поле обязательно для заполнения' : undefined;
};

const validateSocialOrgItemField = (field: keyof SocialOrganization, item: SocialOrganization): string | undefined => {
    return item[field] ? undefined : 'Это поле обязательно для заполнения';
};


// Memoized components for dynamic list items
const OtherLinkItem = React.memo(({ item, index, onChange, onRemove, onBlur, error }: { item: OtherLink, index: number, onChange: (index: number, field: keyof OtherLink, value: any) => void, onRemove: (index: number) => void, onBlur: (index: number) => void, error: string | undefined }) => {
    const handleFieldChange = useCallback((_name: string, value: string) => {
        onChange(index, 'url', value);
    }, [index, onChange]);

    const handleBlur = useCallback(() => onBlur(index), [index, onBlur]);
    
    const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);

    return (
        <div className="flex items-start gap-2">
            <div className="flex-grow">
                <TextInput name={`otherLink-${index}`} value={item.url} onChange={handleFieldChange} onBlur={handleBlur} placeholder="Вставьте ссылку" error={error}/>
            </div>
            <button type="button" onClick={handleRemove} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition shrink-0 mt-1">
                <Trash2 className="h-5 w-5" />
            </button>
        </div>
    );
});

const EducationItem = React.memo(({ item, index, onChange, onRemove, onBlur, errors, touched }: { item: Education, index: number, onChange: (index: number, field: keyof Education, value: any) => void, onRemove: (index: number) => void, onBlur: (index: number, field: keyof Education) => void, errors: Record<string, string | undefined>, touched: Record<string, boolean> }) => {
    const handleFieldChange = useCallback((name: string, value: any) => {
        onChange(index, name as keyof Education, value);
    }, [index, onChange]);

    const handleFieldBlur = useCallback((name: string) => {
        onBlur(index, name as keyof Education);
    }, [index, onBlur]);

    const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);
    
    return (
         <div className="p-4 border rounded-lg bg-gray-50 relative">
            <button type="button" onClick={handleRemove} className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-100 rounded-full transition">
                <Trash2 className="h-5 w-5" />
            </button>
            <h4 className="font-semibold mb-4 text-gray-700">Образование #{index + 1}</h4>
            <div className="space-y-6">
                <Select id={`education.${index}.level`} name="level" label="Уровень образования" options={EDUCATION_LEVELS} selected={item.level} onChange={handleFieldChange} onBlur={handleFieldBlur} required error={touched[`education.${index}.level`] ? errors[`education.${index}.level`] : undefined}/>
                <TextInput id={`education.${index}.organization`} name="organization" label="Название образовательной организации" value={item.organization} onChange={handleFieldChange} onBlur={handleFieldBlur} required error={touched[`education.${index}.organization`] ? errors[`education.${index}.organization`] : undefined}/>
                
                <RadioGroup name="hasPostgraduate" label="Послевузовское профессиональное образование" options={['Да', 'Нет']} selected={item.hasPostgraduate} onChange={handleFieldChange} />
                {item.hasPostgraduate === 'Да' && (
                    <div className="space-y-6 pl-4 border-l-4 border-gray-200">
                        <Select
                            id={`education.${index}.postgraduateType`}
                            name="postgraduateType"
                            label="Вид послевузовского образования"
                            options={POSTGRADUATE_TYPES}
                            selected={item.postgraduateType || ''}
                            onChange={handleFieldChange}
                            onBlur={handleFieldBlur}
                            required
                            error={touched[`education.${index}.postgraduateType`] ? errors[`education.${index}.postgraduateType`] : undefined}
                        />
                        {item.postgraduateType && (
                            <TextInput
                                id={`education.${index}.postgraduateOrganization`}
                                name="postgraduateOrganization"
                                label="Наименование образовательного или научного учреждения"
                                value={item.postgraduateOrganization || ''}
                                onChange={handleFieldChange}
                                onBlur={handleFieldBlur}
                                required
                                error={touched[`education.${index}.postgraduateOrganization`] ? errors[`education.${index}.postgraduateOrganization`] : undefined}
                            />
                        )}
                    </div>
                )}
                
                <RadioGroup name="hasDegree" label="Наличие ученой степени" options={['Да', 'Нет']} selected={item.hasDegree} onChange={handleFieldChange} />
                {item.hasDegree === 'Да' && (
                    <div className="pl-4 border-l-4 border-gray-200">
                        <Select
                            id={`education.${index}.degreeType`}
                            name="degreeType"
                            label="Ученая степень"
                            options={DEGREE_TYPES}
                            selected={item.degreeType || ''}
                            onChange={handleFieldChange}
                            onBlur={handleFieldBlur}
                            required
                            error={touched[`education.${index}.degreeType`] ? errors[`education.${index}.degreeType`] : undefined}
                        />
                    </div>
                )}

                <RadioGroup name="hasTitle" label="Наличие ученого звания" options={['Да', 'Нет']} selected={item.hasTitle} onChange={handleFieldChange} />
                {item.hasTitle === 'Да' && (
                     <div className="pl-4 border-l-4 border-gray-200">
                        <Select
                            id={`education.${index}.titleType`}
                            name="titleType"
                            label="Ученое звание"
                            options={TITLE_TYPES}
                            selected={item.titleType || ''}
                            onChange={handleFieldChange}
                            onBlur={handleFieldBlur}
                            required
                            error={touched[`education.${index}.titleType`] ? errors[`education.${index}.titleType`] : undefined}
                        />
                    </div>
                )}
            </div>
        </div>
    );
});

const WorkItem = React.memo(({ item, index, onChange, onRemove, onBlur, errors, touched }: { item: WorkExperience, index: number, onChange: (index: number, field: keyof WorkExperience, value: any) => void, onRemove: (index: number) => void, onBlur: (index: number, field: keyof WorkExperience) => void, errors: Record<string, string | undefined>, touched: Record<string, boolean> }) => {
    const handleFieldChange = useCallback((name: string, value: any) => {
        onChange(index, name as keyof WorkExperience, value);
    }, [index, onChange]);

    const handleFieldBlur = useCallback((name: string) => {
        onBlur(index, name as keyof WorkExperience);
    }, [index, onBlur]);

    const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);
    
    return (
         <div className="p-4 border rounded-lg bg-gray-50 relative">
            <button type="button" onClick={handleRemove} className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-100 rounded-full transition">
                <Trash2 className="h-5 w-5" />
            </button>
            <h4 className="font-semibold mb-4 text-gray-700">Место работы #{index + 1}</h4>
            <div className="space-y-6">
                <TextInput id={`workExperience.${index}.organization`} label="Название организации" name="organization" value={item.organization} onChange={handleFieldChange} onBlur={handleFieldBlur} required error={touched[`workExperience.${index}.organization`] ? errors[`workExperience.${index}.organization`] : undefined}/>
                <TextInput id={`workExperience.${index}.position`} label="Должность" name="position" value={item.position} onChange={handleFieldChange} onBlur={handleFieldBlur} required error={touched[`workExperience.${index}.position`] ? errors[`workExperience.${index}.position`] : undefined}/>
                <TextInput id={`workExperience.${index}.startDate`} label="Месяц и год начала работы" name="startDate" value={item.startDate} onChange={handleFieldChange} onBlur={handleFieldBlur} placeholder="Например, 01.2020" required error={touched[`workExperience.${index}.startDate`] ? errors[`workExperience.${index}.startDate`] : undefined}/>
            </div>
        </div>
    );
});

const LanguageItem = React.memo(({ item, index, onChange, onRemove, onBlur, languageOptions, itemNumLabel, listName, errors, touched }: { item: Language, index: number, onChange: (index: number, field: keyof Language, value: any) => void, onRemove: (index: number) => void, onBlur: (listName: string, index: number, field: keyof Language) => void, languageOptions: string[], itemNumLabel: string, listName: string, errors: Record<string, string | undefined>, touched: Record<string, boolean> }) => {
    const handleFieldChange = useCallback((name: string, value: any) => {
        onChange(index, name as keyof Language, value);
    }, [index, onChange]);

    const handleFieldBlur = useCallback((name: string) => {
        onBlur(listName, index, name as keyof Language);
    }, [listName, index, onBlur]);

    const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);

    return (
        <div className="p-4 border rounded-lg bg-gray-50 relative">
            <button type="button" onClick={handleRemove} className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-100 rounded-full transition">
                <Trash2 className="h-5 w-5" />
            </button>
            <h4 className="font-semibold mb-4 text-gray-700">{itemNumLabel} #{index + 1}</h4>
            <div className="space-y-6">
                <SearchableSelect id={`${listName}.${index}.name`} name="name" label="Язык" options={languageOptions} selected={item.name} onChange={handleFieldChange} onBlur={handleFieldBlur} required error={touched[`${listName}.${index}.name`] ? errors[`${listName}.${index}.name`] : undefined}/>
                <RadioGroup name="level" label="Уровень владения" options={LANGUAGE_LEVELS} selected={item.level} onChange={handleFieldChange} />
            </div>
        </div>
    );
});

const SocialOrgItem = React.memo(({ item, index, onChange, onRemove, onBlur, errors, touched }: { item: SocialOrganization, index: number, onChange: (index: number, field: keyof SocialOrganization, value: any) => void, onRemove: (index: number) => void, onBlur: (index: number, field: keyof SocialOrganization) => void, errors: Record<string, string | undefined>, touched: Record<string, boolean> }) => {
    const handleFieldChange = useCallback((name: string, value: any) => {
        onChange(index, name as keyof SocialOrganization, value);
    }, [index, onChange]);

    const handleFieldBlur = useCallback((name: string) => {
        onBlur(index, name as keyof SocialOrganization);
    }, [index, onBlur]);

    const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);
    
    return (
        <div className="p-4 border rounded-lg bg-gray-50 relative">
            <button type="button" onClick={handleRemove} className="absolute top-3 right-3 p-1 text-red-500 hover:bg-red-100 rounded-full transition">
                <Trash2 className="h-5 w-5" />
            </button>
            <h4 className="font-semibold mb-4 text-gray-700">Организация #{index + 1}</h4>
            <div className="space-y-6">
                <TextInput id={`socialOrganizations.${index}.name`} label="Название организации" name="name" value={item.name} onChange={handleFieldChange} onBlur={handleFieldBlur} required error={touched[`socialOrganizations.${index}.name`] ? errors[`socialOrganizations.${index}.name`] : undefined} />
                <TextInput id={`socialOrganizations.${index}.position`} label="Должность" name="position" value={item.position} onChange={handleFieldChange} onBlur={handleFieldBlur} required error={touched[`socialOrganizations.${index}.position`] ? errors[`socialOrganizations.${index}.position`] : undefined} />
                <TextInput id={`socialOrganizations.${index}.years`} label="Годы" name="years" value={item.years} onChange={handleFieldChange} onBlur={handleFieldBlur} required placeholder="Например, 2018-2022" error={touched[`socialOrganizations.${index}.years`] ? errors[`socialOrganizations.${index}.years`] : undefined}/>
            </div>
        </div>
    );
});


const RegistrationPage: React.FC = () => {
    const [formData, setFormData] = useState<FormData>(() => {
        try {
            const saved = window.localStorage.getItem(FORM_DATA_KEY);
            return saved ? JSON.parse(saved) : initialFormData;
        } catch {
            return initialFormData;
        }
    });
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(() => {
        const saved = window.localStorage.getItem(FORM_STEP_KEY);
        return saved ? JSON.parse(saved) : 0;
    });
    const [completedSteps, setCompletedSteps] = useState<boolean[]>(() => {
        const saved = window.localStorage.getItem(FORM_COMPLETED_KEY);
        return saved ? JSON.parse(saved) : Array(SECTIONS.length).fill(false);
    });
    const [isSubmitted, setIsSubmitted] = useState<boolean>(() => {
        try {
            const saved = window.localStorage.getItem(FORM_SUBMITTED_KEY);
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    const contentRef = useRef<HTMLDivElement>(null);
    const mobileStepperRef = useRef<HTMLUListElement>(null);
    const isFormValid = completedSteps.every(s => s);

    const formDataRef = useRef(formData);
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);
    
    useEffect(() => {
        // Capture Telegram ID from URL on initial load, overriding any stored ID.
        try {
            const params = new URLSearchParams(window.location.search);
            const telegramId = params.get('telegram_id');
            if (telegramId) {
                setFormData(prev => {
                    if (prev.telegramId !== telegramId) {
                        return { ...prev, telegramId };
                    }
                    return prev;
                });
            }
        } catch (e) {
            console.error("Could not parse URL params", e);
        }
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData));
        } catch (e) { console.error('Failed to save form data to local storage', e); }
    }, [formData]);

    useEffect(() => {
        window.localStorage.setItem(FORM_STEP_KEY, JSON.stringify(currentStep));
    }, [currentStep]);
    
    useEffect(() => {
        window.localStorage.setItem(FORM_COMPLETED_KEY, JSON.stringify(completedSteps));
    }, [completedSteps]);


    const isStepComplete = useCallback((index: number, data: FormData): boolean => {
        const section = SECTIONS[index];
        for (const field of section.fields) {
            if (validateField(field as keyof FormData, data)) return false;
        }

        if (index === 1) { // Contact Info
            if (data.otherLinks.some(link => !link.url || !URL_REGEX.test(link.url))) {
                return false;
            }
        }

        if (index === 2) { // Education
            if (data.education.length === 0) return false;
            for (const edu of data.education) {
                if (validateEducationItemField('level', edu) ||
                    validateEducationItemField('organization', edu) ||
                    validateEducationItemField('postgraduateType', edu) ||
                    validateEducationItemField('postgraduateOrganization', edu) ||
                    validateEducationItemField('degreeType', edu) ||
                    validateEducationItemField('titleType', edu)) {
                    return false;
                }
            }
        }
        
        if (index === 3) { // Languages
            if (data.foreignLanguages.length === 0 && data.russianFederationLanguages.length === 0) return false;
            for(const lang of data.foreignLanguages) if(validateLanguageItemField('name', lang)) return false;
            for(const lang of data.russianFederationLanguages) if(validateLanguageItemField('name', lang)) return false;
        }

        if (index === 4) { // Work
            if (data.workExperience.length === 0) return false;
            for(const work of data.workExperience) {
                if(validateWorkItemField('organization', work) || validateWorkItemField('position', work) || validateWorkItemField('startDate', work)) return false;
            }
        }

        if (index === 7) { // Social Organizations
            for(const org of data.socialOrganizations) {
                if(validateSocialOrgItemField('name', org) || validateSocialOrgItemField('position', org) || validateSocialOrgItemField('years', org)) return false;
            }
        }

        return true;
    }, []);

    useEffect(() => {
        const newCompleted = SECTIONS.map((_, i) => isStepComplete(i, formData));

        setCompletedSteps(prevCompletedSteps => {
            if (prevCompletedSteps) {
                 prevCompletedSteps.forEach((wasComplete, index) => {
                    if (wasComplete && !newCompleted[index] && index !== currentStep) {
                        setNotification({
                            message: `Раздел '${SECTIONS[index].title}' стал неполным. Пожалуйста, проверьте его.`,
                            type: 'error'
                        });
                    }
                });
            }

            if (JSON.stringify(newCompleted) !== JSON.stringify(prevCompletedSteps)) {
                return newCompleted;
            }
            return prevCompletedSteps;
        });
    }, [formData, isStepComplete, currentStep]);


    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        if (isSubmitted) return;
        const activeStepElement = mobileStepperRef.current?.querySelector(`[data-step-index="${currentStep}"]`);
        if (activeStepElement) {
            activeStepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [currentStep, isSubmitted]);
    
    const handleFieldChange = useCallback((field: keyof FormData, value: any) => {
        const newFormData = { ...formDataRef.current };
        (newFormData as any)[field] = value;
        
        // Apply dependent field logic
        if (field === 'gender') newFormData.maritalStatus = value === 'Мужчина' ? 'Холост' : 'Не замужем';
        if (field === 'partyRole' && value !== 'Другая') newFormData.partyRoleOther = '';
        if (field === 'childrenCount' && (!value || parseInt(value, 10) === 0)) {
            newFormData.childrenMaleCount = '';
            newFormData.childrenFemaleCount = '';
            newFormData.underageChildrenCount = '';
            newFormData.underageChildrenMaleCount = '';
            newFormData.underageChildrenFemaleCount = '';
        }
        if (field === 'underageChildrenCount' && (!value || parseInt(value, 10) === 0)) {
            newFormData.underageChildrenMaleCount = '';
            newFormData.underageChildrenFemaleCount = '';
        }
        
        // Children auto-calculation logic
        if (field === 'childrenMaleCount' || field === 'childrenFemaleCount') {
            const total = parseInt(newFormData.childrenCount, 10);
            if (!isNaN(total) && total > 0) {
                if (field === 'childrenMaleCount') {
                    const male = parseInt(value, 10);
                    if (!isNaN(male) && male >= 0 && male <= total) {
                        newFormData.childrenFemaleCount = (total - male).toString();
                    }
                } else { // childrenFemaleCount
                    const female = parseInt(value, 10);
                    if (!isNaN(female) && female >= 0 && female <= total) {
                        newFormData.childrenMaleCount = (total - female).toString();
                    }
                }
            }
        }
        
        if (field === 'underageChildrenMaleCount' || field === 'underageChildrenFemaleCount') {
            const total = parseInt(newFormData.underageChildrenCount, 10);
            if (!isNaN(total) && total > 0) {
                if (field === 'underageChildrenMaleCount') {
                    const male = parseInt(value, 10);
                    if (!isNaN(male) && male >= 0 && male <= total) {
                        newFormData.underageChildrenFemaleCount = (total - male).toString();
                    }
                } else { // underageChildrenFemaleCount
                    const female = parseInt(value, 10);
                    if (!isNaN(female) && female >= 0 && female <= total) {
                        newFormData.underageChildrenMaleCount = (total - female).toString();
                    }
                }
            }
        }
        
        // Update the state
        setFormData(newFormData);

        // Re-validate if the field was already touched (i.e., had an error)
        if (touched[field as keyof typeof touched]) {
            setErrors(prev => ({ ...prev, [field]: validateField(field, newFormData) }));

            const revalidateCounterpart = (counterpart: keyof FormData) => {
                 setErrors(prev => ({ ...prev, [counterpart]: validateField(counterpart, newFormData) }));
            }
    
            if (field === 'childrenMaleCount') revalidateCounterpart('childrenFemaleCount');
            if (field === 'childrenFemaleCount') revalidateCounterpart('childrenMaleCount');
            if (field === 'underageChildrenMaleCount') revalidateCounterpart('underageChildrenFemaleCount');
            if (field === 'underageChildrenFemaleCount') revalidateCounterpart('underageChildrenMaleCount');
        }
    }, [touched]);

    const handleFieldBlur = useCallback((field: keyof FormData) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({ ...prev, [field]: validateField(field, formDataRef.current) }));
    }, []);
    
    const addDynamicListItem = useCallback((listName: keyof FormData, item: any) => {
        setFormData(prev => ({ ...prev, [listName]: [...(prev[listName] as any[]), item] }));
    }, []);

    const removeDynamicListItem = useCallback((listName: keyof FormData, index: number) => {
        setFormData(prev => ({ ...prev, [listName]: (prev[listName] as any[]).filter((_, i) => i !== index) }));
        // Also remove errors and touched state for the removed item
        setErrors(prevErrors => {
            const newErrors = {...prevErrors};
            Object.keys(newErrors).forEach(key => {
                if (key.startsWith(`${listName}.${index}.`)) {
                    delete newErrors[key];
                }
            });
            return newErrors;
        });
        setTouched(prevTouched => {
            const newTouched = {...prevTouched};
             Object.keys(newTouched).forEach(key => {
                if (key.startsWith(`${listName}.${index}.`)) {
                    delete newTouched[key];
                }
            });
            return newTouched;
        });
    }, []);
    
    const handleAddCustomOption = useCallback((listKey: keyof FormData, customListKey: keyof FormData, option: string) => {
        setFormData(prev => {
            const newFormData = { ...prev };
            const customList = (newFormData[customListKey] as string[]) || [];
            const mainList = (newFormData[listKey] as string[]) || [];

            if (!customList.includes(option) && !mainList.includes(option)) {
                (newFormData[customListKey] as string[]) = [...customList, option];
                (newFormData[listKey] as string[]) = [...mainList, option];
            }
            return newFormData;
        });
    }, []);

    const handleRemoveCustomOption = useCallback((listKey: keyof FormData, customListKey: keyof FormData, option: string) => {
        setFormData(prev => {
            const newFormData = { ...prev };
            (newFormData[customListKey] as string[]) = ((newFormData[customListKey] as string[]) || []).filter(item => item !== option);
            (newFormData[listKey] as string[]) = ((newFormData[listKey] as string[]) || []).filter(item => item !== option);
            return newFormData;
        });
    }, []);

    const addOtherLink = useCallback(() => addDynamicListItem('otherLinks', { url: '' }), [addDynamicListItem]);
    const removeOtherLink = useCallback((index: number) => removeDynamicListItem('otherLinks', index), [removeDynamicListItem]);
    
    const handleOtherLinkChange = (index: number, field: keyof OtherLink, value: any) => {
        const fieldKey = `otherLinks.${index}.url`;
        setFormData(prev => {
            const newList = [...prev.otherLinks];
            const updatedItem = { ...newList[index], [field]: value };
            newList[index] = updatedItem;
            return { ...prev, otherLinks: newList };
        });

        if (touched[fieldKey]) {
            const error = !value ? 'Это поле обязательно для заполнения' : !URL_REGEX.test(value) ? 'Неверный формат ссылки' : undefined;
            setErrors(prev => ({ ...prev, [fieldKey]: error }));
        }
    };

     const handleOtherLinkBlur = (index: number) => {
        const key = `otherLinks.${index}.url`;
        setTouched(prev => ({ ...prev, [key]: true }));
        const item = formDataRef.current.otherLinks[index];
        const error = !item.url ? 'Это поле обязательно для заполнения' : !URL_REGEX.test(item.url) ? 'Неверный формат ссылки' : undefined;
        setErrors(prev => ({ ...prev, [key]: error }));
    };

    const addEducation = useCallback(() => addDynamicListItem('education', { level: '', organization: '', hasPostgraduate: 'Нет', postgraduateType: '', postgraduateOrganization: '', hasDegree: 'Нет', degreeType: '', hasTitle: 'Нет', titleType: '' }), [addDynamicListItem]);
    const removeEducation = useCallback((index: number) => removeDynamicListItem('education', index), [removeDynamicListItem]);
    
    const handleEducationChange = (index: number, field: keyof Education, value: any) => {
        const fieldKey = `education.${index}.${field}`;
        setFormData(prev => {
            const newEducations = [...prev.education];
            const updatedItem = { ...newEducations[index] };
            (updatedItem as any)[field] = value;

            if (field === 'hasDegree' && value === 'Нет') updatedItem.degreeType = '';
            if (field === 'hasTitle' && value === 'Нет') updatedItem.titleType = '';
            if (field === 'hasPostgraduate' && value === 'Нет') {
                updatedItem.postgraduateType = '';
                updatedItem.postgraduateOrganization = '';
            }
            if (field === 'postgraduateType' && !value) updatedItem.postgraduateOrganization = '';
            newEducations[index] = updatedItem;
            return { ...prev, education: newEducations };
        });

        if (touched[fieldKey]) {
            setErrors(prev => {
                const item = formDataRef.current.education[index];
                const updatedItem = { ...item, [field]: value };
                const error = validateEducationItemField(field, updatedItem);
                return { ...prev, [fieldKey]: error };
            });
        }
    };

    const handleDynamicItemBlur = (listName: string, index: number, field: string) => {
        const fieldKey = `${listName}.${index}.${field}`;
        setTouched(prev => ({ ...prev, [fieldKey]: true }));
        const item = (formDataRef.current[listName as keyof FormData] as any[])[index];
        let error: string | undefined;
        switch (listName) {
            case 'education': error = validateEducationItemField(field as keyof Education, item); break;
            case 'workExperience': error = validateWorkItemField(field as keyof WorkExperience, item); break;
            case 'socialOrganizations': error = validateSocialOrgItemField(field as keyof SocialOrganization, item); break;
            case 'foreignLanguages': case 'russianFederationLanguages': error = validateLanguageItemField(field as keyof Language, item); break;
        }
        setErrors(prev => ({ ...prev, [fieldKey]: error }));
    };
    
    const handleEducationItemBlur = useCallback((index: number, field: keyof Education) => handleDynamicItemBlur('education', index, field), [handleDynamicItemBlur]);
    const handleWorkItemBlur = useCallback((index: number, field: keyof WorkExperience) => handleDynamicItemBlur('workExperience', index, field), [handleDynamicItemBlur]);
    const handleSocialOrgItemBlur = useCallback((index: number, field: keyof SocialOrganization) => handleDynamicItemBlur('socialOrganizations', index, field), [handleDynamicItemBlur]);
    const handleLanguageItemBlur = useCallback((listName: string, index: number, field: keyof Language) => handleDynamicItemBlur(listName, index, field), [handleDynamicItemBlur]);
    
    const addWorkExperience = useCallback(() => addDynamicListItem('workExperience', { organization: '', position: '', startDate: '' }), [addDynamicListItem]);
    const removeWorkExperience = useCallback((index: number) => removeDynamicListItem('workExperience', index), [removeDynamicListItem]);
    
    const handleWorkExperienceChange = (index: number, field: keyof WorkExperience, value: any) => {
        const fieldKey = `workExperience.${index}.${field}`;
        setFormData(prev => {
            const newList = [...prev.workExperience];
            const updatedItem = { ...newList[index], [field]: value };
            newList[index] = updatedItem;
            return { ...prev, workExperience: newList };
        });

        if (touched[fieldKey]) {
            const updatedItem = { ...formDataRef.current.workExperience[index], [field]: value };
            const error = validateWorkItemField(field, updatedItem);
            setErrors(prev => ({ ...prev, [fieldKey]: error }));
        }
    };

    const addForeignLanguage = useCallback(() => addDynamicListItem('foreignLanguages', { name: '', level: 'Читаю и перевожу со словарем' }), [addDynamicListItem]);
    const removeForeignLanguage = useCallback((index: number) => removeDynamicListItem('foreignLanguages', index), [removeDynamicListItem]);

    const handleForeignLanguageChange = (index: number, field: keyof Language, value: any) => {
        const listName = 'foreignLanguages';
        const fieldKey = `${listName}.${index}.${field}`;
        setFormData(prev => {
            const newList = [...prev[listName]];
            const updatedItem = { ...newList[index], [field]: value };
            newList[index] = updatedItem;
            return { ...prev, [listName]: newList };
        });

        if (touched[fieldKey]) {
            const updatedItem = { ...formDataRef.current[listName][index], [field]: value };
            const error = validateLanguageItemField(field, updatedItem);
            setErrors(prev => ({ ...prev, [fieldKey]: error }));
        }
    };
    
    const addRussianFederationLanguage = useCallback(() => addDynamicListItem('russianFederationLanguages', { name: '', level: 'Читаю и перевожу со словарем' }), [addDynamicListItem]);
    const removeRussianFederationLanguage = useCallback((index: number) => removeDynamicListItem('russianFederationLanguages', index), [removeDynamicListItem]);
    
    const handleRussianFederationLanguageChange = (index: number, field: keyof Language, value: any) => {
        const listName = 'russianFederationLanguages';
        const fieldKey = `${listName}.${index}.${field}`;
        setFormData(prev => {
            const newList = [...prev[listName]];
            const updatedItem = { ...newList[index], [field]: value };
            newList[index] = updatedItem;
            return { ...prev, [listName]: newList };
        });

        if (touched[fieldKey]) {
            const updatedItem = { ...formDataRef.current[listName][index], [field]: value };
            const error = validateLanguageItemField(field, updatedItem);
            setErrors(prev => ({ ...prev, [fieldKey]: error }));
        }
    };

    const addSocialOrganization = useCallback(() => addDynamicListItem('socialOrganizations', { name: '', position: '', years: '' }), [addDynamicListItem]);
    const removeSocialOrganization = useCallback((index: number) => removeDynamicListItem('socialOrganizations', index), [removeDynamicListItem]);
    
    const handleSocialOrganizationChange = (index: number, field: keyof SocialOrganization, value: any) => {
        const listName = 'socialOrganizations';
        const fieldKey = `${listName}.${index}.${field}`;
        setFormData(prev => {
            const newList = [...prev[listName]];
            const updatedItem = { ...newList[index], [field]: value };
            newList[index] = updatedItem;
            return { ...prev, [listName]: newList };
        });
        
        if (touched[fieldKey]) {
            const updatedItem = { ...formDataRef.current[listName][index], [field]: value };
            const error = validateSocialOrgItemField(field, updatedItem);
            setErrors(prev => ({ ...prev, [fieldKey]: error }));
        }
    };

    const validateCurrentStep = () => {
        const isComplete = isStepComplete(currentStep, formData);
        if (!isComplete) {
            const stepErrors: Record<string, string | undefined> = {};
            const stepTouched: Record<string, boolean> = {};

            (SECTIONS[currentStep].fields as Array<keyof FormData>).forEach(key => {
                stepTouched[key] = true;
                const error = validateField(key, formData);
                if (error) stepErrors[key] = error;
            });

            if (currentStep === 1) {
                formData.otherLinks.forEach((link, index) => {
                    const key = `otherLinks.${index}.url`;
                    stepTouched[key] = true;
                    const error = !link.url ? 'Это поле обязательно для заполнения' : !URL_REGEX.test(link.url) ? 'Неверный формат ссылки' : undefined;
                    if (error) stepErrors[key] = error;
                });
            }

            if (currentStep === 2) {
                formData.education.forEach((edu, index) => {
                    Object.keys(edu).forEach(field => {
                        const key = `education.${index}.${field}`;
                        stepTouched[key] = true;
                        const error = validateEducationItemField(field as keyof Education, edu);
                        if(error) stepErrors[key] = error;
                    });
                });
            }

            setErrors(prev => ({ ...prev, ...stepErrors }));
            setTouched(prev => ({ ...prev, ...stepTouched }));

            let message = 'Пожалуйста, исправьте ошибки в текущем разделе.';
            
            // Specific messages for empty dynamic lists or specific validation failures
            if (currentStep === 2 && formData.education.length === 0) {
                message = 'Пожалуйста, добавьте информацию о вашем образовании.';
            } else if (currentStep === 3 && formData.foreignLanguages.length === 0 && formData.russianFederationLanguages.length === 0) {
                message = 'Пожалуйста, добавьте хотя бы один язык, которым вы владеете.';
            } else if (currentStep === 4 && formData.workExperience.length === 0) {
                message = 'Пожалуйста, добавьте хотя бы одно место работы.';
            }

            setNotification({ message, type: 'error' });
        }
        return isComplete;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            if (currentStep < SECTIONS.length - 1) {
                setCurrentStep(currentStep + 1);
                contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const handleStepClick = (index: number) => {
        if (index < currentStep || completedSteps[index]) {
            setCurrentStep(index);
        }
    };

    const prepareDataForSubmission = (data: FormData) => {
        const processedData = { ...data };

        if (processedData.partyRole === 'Другая') {
            processedData.partyRole = processedData.partyRoleOther;
        }
        delete (processedData as any).partyRoleOther;

        const customFields: (keyof FormData)[] = ['sportsCustom', 'recreationCustom', 'hobbiesCustom', 'ldprResourcesCustom', 'knowledgeGapsCustom'];
        const selectionFields: (keyof FormData)[] = ['sports', 'recreation', 'hobbies', 'ldprResources', 'knowledgeGaps'];

        customFields.forEach(field => delete (processedData as any)[field]);
        selectionFields.forEach(field => {
            if (Array.isArray(processedData[field])) {
                (processedData as any)[field] = (processedData[field] as string[]).filter(item => item !== 'Другое');
            }
        });

        // Reorder at the end to ensure telegramId is first
        const { telegramId, ...rest } = processedData;
        return { telegramId, ...rest };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isFormValid) {
            setNotification({ message: 'Пожалуйста, заполните все обязательные поля во всех разделах.', type: 'error' });
            // Find first invalid step and navigate to it
            const firstInvalidStep = completedSteps.findIndex(c => !c);
            if(firstInvalidStep !== -1) setCurrentStep(firstInvalidStep);
            return;
        }
        const finalData = prepareDataForSubmission(formData);
        try {
            const response = await fetch(`${BASE_URL}api/auth/registration-forms/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // If using CSRF protection (e.g., with SessionAuthentication in DRF),
                    // you might need to fetch the CSRF token from a cookie and include it:
                    // 'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify(finalData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Ошибка при отправке данных на сервер:', errorData);
                let errorMessage = 'Ошибка при отправке формы. Пожалуйста, проверьте введенные данные.';
                
                // Attempt to parse specific error messages from DRF.
                // drf-camel-case also camelizes validation errors, so keys might be camelCase.
                if (typeof errorData === 'object' && errorData !== null) {
                    const generalErrors = errorData.nonFieldErrors || errorData.detail;
                    if (generalErrors) {
                        errorMessage = Array.isArray(generalErrors) ? generalErrors[0] : generalErrors;
                    } else {
                        // Try to find the first field error
                        const firstErrorKey = Object.keys(errorData)[0];
                        if (firstErrorKey && errorData[firstErrorKey]) {
                            // DRF errors are often arrays for fields
                            const fieldError = Array.isArray(errorData[firstErrorKey]) ? errorData[firstErrorKey][0] : errorData[firstErrorKey];
                            errorMessage = `${firstErrorKey}: ${fieldError}`;
                        }
                    }
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }
                setNotification({ message: errorMessage, type: 'error' });
                return; // Stop further execution on error
            }

            const successData = await response.json();
            console.log('Данные успешно сохранены:', successData);
            
            try {
                window.localStorage.setItem(FORM_SUBMITTED_KEY, 'true');
                setIsSubmitted(true);
            } catch (error) {
                console.error('Failed to save submission status to local storage', error);
            }
            
            setNotification({ message: 'Отчёт успешно отправлен и сохранен!', type: 'success' });

        } catch (error) {
            console.error('Сетевая ошибка при отправке формы:', error);
            setNotification({ message: 'Не удалось подключиться к серверу. Проверьте ваше интернет-соединение или попробуйте позже.', type: 'error' });
        }    
    };
    
    const handleClearForm = useCallback(() => {
        setIsClearConfirmOpen(false);
        setFormData(initialFormData);
        setCurrentStep(0);
        setCompletedSteps(Array(SECTIONS.length).fill(false));
        setErrors({});
        setTouched({});
        try {
            window.localStorage.removeItem(FORM_DATA_KEY);
            window.localStorage.removeItem(FORM_STEP_KEY);
            window.localStorage.removeItem(FORM_COMPLETED_KEY);
            window.localStorage.removeItem(FORM_SUBMITTED_KEY);
            setIsSubmitted(false);
        } catch (e) {
            console.error('Failed to clear form data from local storage', e);
        }
        setNotification({ message: 'Форма успешно очищена.', type: 'success' });
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    
    const handleEditForm = useCallback(() => {
        try {
            window.localStorage.removeItem(FORM_SUBMITTED_KEY);
            setIsSubmitted(false);
            setCurrentStep(0);
        } catch (e) {
            console.error('Failed to clear submission status from local storage', e);
        }
    }, []);

    const AddItemButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
        <button type="button" onClick={onClick} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
            <Plus className="h-5 w-5" /> {children}
        </button>
    );

    const maritalStatusOptions = formData.gender === 'Мужчина' ? ['Женат', 'Холост'] : ['Замужем', 'Не замужем'];

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return (
                <div className="space-y-6">
                    <TextInput label="Фамилия" name="lastName" value={formData.lastName} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.lastName ? errors.lastName : undefined} required format="capitalizeName" />
                    <TextInput label="Имя" name="firstName" value={formData.firstName} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.firstName ? errors.firstName : undefined} required format="capitalizeName" />
                    <TextInput label="Отчество" name="middleName" value={formData.middleName} onChange={handleFieldChange} format="capitalizeName" />
                    <RadioGroup label="Пол" name="gender" options={['Мужчина', 'Женщина']} selected={formData.gender} onChange={handleFieldChange} />
                    <DateInput label="Дата рождения" name="birthDate" value={formData.birthDate} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.birthDate ? errors.birthDate : undefined} required />
                    <SearchableSelect label="Ваш регион" name="region" options={REGIONS} selected={formData.region} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.region ? errors.region : undefined} required />
                </div>
            );
            case 1: return (
                <div className="space-y-6">
                 <TextInput label="Телефон" name="phone" value={formData.phone} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.phone ? errors.phone : undefined} required placeholder="+79991234567" />
                 <TextInput label="Адрес электронной почты" name="email" value={formData.email} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.email ? errors.email : undefined} required placeholder="example@mail.com" />
                 <TextInput label="Ссылка на вашу страницу ВКонтакте" name="vkPage" value={formData.vkPage} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.vkPage ? errors.vkPage : undefined} required />
                 <TextInput label="Ссылка на ваше сообщество ВКонтакте" name="vkGroup" value={formData.vkGroup} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.vkGroup ? errors.vkGroup : undefined} placeholder="Оставьте пустым, если нет" />
                 <TextInput label="Ссылка на ваш телеграм-канал" name="telegramChannel" value={formData.telegramChannel} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.telegramChannel ? errors.telegramChannel : undefined} placeholder="Оставьте пустым, если нет" />
                 <TextInput label="Ссылка на ваш персональный сайт" name="personalSite" value={formData.personalSite} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.personalSite ? errors.personalSite : undefined} placeholder="Оставьте пустым, если нет" />
                 <div>
                    <label className="block text-base font-semibold text-gray-800 mb-2">Ссылки на другие страницы (Одноклассники, Rutube и др.)</label>
                    {formData.otherLinks.length > 0 && (
                        <div className="space-y-3">
                            {formData.otherLinks.map((link, index) => <OtherLinkItem key={index} index={index} item={link} onChange={handleOtherLinkChange} onRemove={removeOtherLink} onBlur={handleOtherLinkBlur} error={touched[`otherLinks.${index}.url`] ? errors[`otherLinks.${index}.url`] : undefined} />)}
                        </div>
                    )}
                     <AddItemButton onClick={addOtherLink}>Добавить ссылку</AddItemButton>
                </div>
                </div>
            );
            case 2:
                return (
                    <>
                        {formData.education.length === 0 && <EmptyStatePlaceholder imageUrl="images/registration_form/sokol_ldpr_1.webp" />}
                        <div className="space-y-4 mb-4">
                            {formData.education.map((edu, index) => <EducationItem key={index} index={index} item={edu} onChange={handleEducationChange} onRemove={removeEducation} onBlur={handleEducationItemBlur} errors={errors} touched={touched} />)}
                        </div>
                        <AddItemButton onClick={addEducation}>Добавить образование</AddItemButton>
                    </>
                );
            case 3: {
                const selectedForeign = formData.foreignLanguages.map(l => l.name).filter(Boolean);
                const selectedRussian = formData.russianFederationLanguages.map(l => l.name).filter(Boolean);
                return (
                    <div className="space-y-8">
                        {formData.foreignLanguages.length === 0 && formData.russianFederationLanguages.length === 0 && <EmptyStatePlaceholder imageUrl="images/registration_form/sokol_ldpr_2.webp" />}
                        <div>
                            <label className="block text-base font-semibold text-gray-800 mb-4">Владение иностранными языками</label>
                            {formData.foreignLanguages.length > 0 && (
                                <div className="space-y-4 mb-4">
                                    {formData.foreignLanguages.map((lang, index) => {
                                        const availableOptions = FOREIGN_LANGUAGES.filter(option => !selectedForeign.includes(option) || option === lang.name);
                                        return <LanguageItem key={index} index={index} item={lang} onChange={handleForeignLanguageChange} onRemove={removeForeignLanguage} onBlur={handleLanguageItemBlur} languageOptions={availableOptions} itemNumLabel="Иностранный язык" listName="foreignLanguages" errors={errors} touched={touched}/>
                                    })}
                                </div>
                            )}
                            <AddItemButton onClick={addForeignLanguage}>Добавить иностранный язык</AddItemButton>
                        </div>
                        <div>
                            <label className="block text-base font-semibold text-gray-800 mb-4">Владение языками народов РФ (кроме русского)</label>
                             {formData.russianFederationLanguages.length > 0 && (
                                <div className="space-y-4 mb-4">
                                    {formData.russianFederationLanguages.map((lang, index) => {
                                        const availableOptions = RUSSIAN_FEDERATION_LANGUAGES.filter(option => !selectedRussian.includes(option) || option === lang.name);
                                        return <LanguageItem key={index} index={index} item={lang} onChange={handleRussianFederationLanguageChange} onRemove={removeRussianFederationLanguage} onBlur={handleLanguageItemBlur} languageOptions={availableOptions} itemNumLabel="Язык народов РФ" listName="russianFederationLanguages" errors={errors} touched={touched}/>
                                    })}
                                </div>
                            )}
                            <AddItemButton onClick={addRussianFederationLanguage}>Добавить язык народов РФ</AddItemButton>
                        </div>
                    </div>
                );
            }
            case 4:
                return (
                    <>
                        {formData.workExperience.length === 0 && <EmptyStatePlaceholder imageUrl="images/registration_form/sokol_ldpr_3.webp" />}
                        <div className="space-y-4 mb-4">
                            {formData.workExperience.map((work, index) => <WorkItem key={index} index={index} item={work} onChange={handleWorkExperienceChange} onRemove={removeWorkExperience} onBlur={handleWorkItemBlur} errors={errors} touched={touched} />)}
                        </div>
                        <AddItemButton onClick={addWorkExperience}>Добавить место работы</AddItemButton>
                    </>
                );
            case 5: return (
                 <div className="space-y-6">
                    <RadioGroup label="Семейное положение" name="maritalStatus" options={maritalStatusOptions} selected={formData.maritalStatus} onChange={handleFieldChange} />
                    <div className="space-y-6">
                        <NumberInput label="Количество детей" name="childrenCount" value={formData.childrenCount} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.childrenCount ? errors.childrenCount : undefined} required />
                        {(parseInt(formData.childrenCount, 10) || 0) > 0 && (
                            <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l-4 border-gray-200">
                                <NumberInput label="Из них мальчиков" name="childrenMaleCount" value={formData.childrenMaleCount} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.childrenMaleCount ? errors.childrenMaleCount : undefined} required />
                                <NumberInput label="Из них девочек" name="childrenFemaleCount" value={formData.childrenFemaleCount} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.childrenFemaleCount ? errors.childrenFemaleCount : undefined} required />
                            </div>
                        )}
                    </div>
                    {(parseInt(formData.childrenCount, 10) || 0) > 0 && (
                        <div className="space-y-6 mt-8 pt-6 border-t border-gray-200">
                            <NumberInput label="Количество несовершеннолетних детей" name="underageChildrenCount" value={formData.underageChildrenCount} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.underageChildrenCount ? errors.underageChildrenCount : undefined} required />
                            {(parseInt(formData.underageChildrenCount, 10) || 0) > 0 && (
                                <div className="grid sm:grid-cols-2 gap-6 pl-4 border-l-4 border-gray-200">
                                    <NumberInput label="Из них мальчиков" name="underageChildrenMaleCount" value={formData.underageChildrenMaleCount} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.underageChildrenMaleCount ? errors.underageChildrenMaleCount : undefined} />
                                    <NumberInput label="Из них девочек" name="underageChildrenFemaleCount" value={formData.underageChildrenFemaleCount} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.underageChildrenFemaleCount ? errors.underageChildrenFemaleCount : undefined} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
            case 6: return (
                <div className="space-y-6">
                    <NumberInput label="Стаж в партии (лет)" name="partyExperience" value={formData.partyExperience} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.partyExperience ? errors.partyExperience : undefined} required />
                    <TextInput label="Должность в партии" name="partyPosition" value={formData.partyPosition} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.partyPosition ? errors.partyPosition : undefined} required />
                    <Select label="Должность в региональном отделении" name="partyRole" options={PARTY_ROLES} selected={formData.partyRole} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.partyRole ? errors.partyRole : undefined} required />
                    {formData.partyRole === 'Другая' && (
                        <TextInput label="Уточните вашу роль" name="partyRoleOther" value={formData.partyRoleOther} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.partyRoleOther ? errors.partyRoleOther : undefined} required />
                    )}
                </div>
            );
            case 7: return (
                <div className="space-y-6">
                   <TextInput label="Наименование представительного органа" name="representativeBodyName" value={formData.representativeBodyName} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.representativeBodyName ? errors.representativeBodyName : undefined} required />
                   <Select label="Уровень представительного органа" name="representativeBodyLevel" options={REPRESENTATIVE_BODY_LEVELS} selected={formData.representativeBodyLevel} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.representativeBodyLevel ? errors.representativeBodyLevel : undefined} required />
                   <TextInput label="Ваша должность в представительном органе" name="representativeBodyPosition" value={formData.representativeBodyPosition} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.representativeBodyPosition ? errors.representativeBodyPosition : undefined} required />
                   <TextInput label="Название комиссии или комитета" name="committeeName" value={formData.committeeName} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.committeeName ? errors.committeeName : undefined} required />
                   <Select label="Статус в комиссии или комитете" name="committeeStatus" options={COMMITTEE_STATUSES} selected={formData.committeeStatus} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.committeeStatus ? errors.committeeStatus : undefined} required />
                 <div className="mt-2">
                    <label className="block text-base font-semibold text-gray-800 mb-2">Общественные организации, в которых вы состоите</label>
                    {formData.socialOrganizations.length === 0 && <p className="text-sm text-gray-500">Нет добавленных организаций.</p>}
                    {formData.socialOrganizations.length > 0 && (
                        <div className="space-y-4 mb-4">
                            {formData.socialOrganizations.map((org, index) => <SocialOrgItem key={index} index={index} item={org} onChange={handleSocialOrganizationChange} onRemove={removeSocialOrganization} onBlur={handleSocialOrgItemBlur} errors={errors} touched={touched}/>)}
                        </div>
                    )}
                     <AddItemButton onClick={addSocialOrganization}>Добавить организацию</AddItemButton>
                </div>
                </div>
            );
            case 8: return (
                <div className="space-y-8">
                    <CheckboxGroup 
                        label="Укажите сферу профессиональной деятельности и законотворческой работы" 
                        name="professionalSphere" 
                        options={PROFESSIONAL_SPHERES} 
                        selectedOptions={formData.professionalSphere} 
                        onChange={handleFieldChange} 
                        maxSelections={4} 
                        error={touched.professionalSphere ? errors.professionalSphere : undefined} 
                        helperText={`Выберите ровно 4 варианта. (${formData.professionalSphere.length}/4)`}
                    />
                    <TextInput type="textarea" label="Укажите имеющиеся награды (при наличии)" name="awards" value={formData.awards} onChange={handleFieldChange} />
                </div>
            );
            case 9: return (
                <div className="space-y-8">
                    <CheckboxGroup label="Какими видами спорта вы занимаетесь?" name="sports" options={SPORTS} selectedOptions={formData.sports} onChange={handleFieldChange} error={touched.sports ? errors.sports : undefined} customOptions={formData.sportsCustom} onAddCustomOption={(option) => handleAddCustomOption('sports', 'sportsCustom', option)} onRemoveCustomOption={(option) => handleRemoveCustomOption('sports', 'sportsCustom', option)} />
                    <CheckboxGroup label="Какими видами активного отдыха вы увлекаетесь?" name="recreation" options={RECREATION} selectedOptions={formData.recreation} onChange={handleFieldChange} error={touched.recreation ? errors.recreation : undefined} customOptions={formData.recreationCustom} onAddCustomOption={(option) => handleAddCustomOption('recreation', 'recreationCustom', option)} onRemoveCustomOption={(option) => handleRemoveCustomOption('recreation', 'recreationCustom', option)} />
                    <CheckboxGroup label="Ваши увлечения и интересы?" name="hobbies" options={HOBBIES} selectedOptions={formData.hobbies} onChange={handleFieldChange} error={touched.hobbies ? errors.hobbies : undefined} customOptions={formData.hobbiesCustom} onAddCustomOption={(option) => handleAddCustomOption('hobbies', 'hobbiesCustom', option)} onRemoveCustomOption={(option) => handleRemoveCustomOption('hobbies', 'hobbiesCustom', option)} />
                </div>
            );
            case 10: return (
                <div className="space-y-8">
                    <CheckboxGroup label="Какие ресурсы ЛДПР вы используете в работе?" name="ldprResources" options={LDPR_RESOURCES} selectedOptions={formData.ldprResources} onChange={handleFieldChange} error={touched.ldprResources ? errors.ldprResources : undefined} customOptions={formData.ldprResourcesCustom} onAddCustomOption={(option) => handleAddCustomOption('ldprResources', 'ldprResourcesCustom', option)} onRemoveCustomOption={(option) => handleRemoveCustomOption('ldprResources', 'ldprResourcesCustom', option)} conditionalField={{ trigger: "Помощь сотрудников Центрального аппарата", label: "кого из Центрального Аппарата могли бы отметить", name: "centralOfficeAssistant", value: formData.centralOfficeAssistant, onChange: handleFieldChange, placeholder: "можете перечислить через запятую", required: false }} />
                    <CheckboxGroup label="Каких знаний вам не хватает? Что хотите изучить?" name="knowledgeGaps" options={KNOWLEDGE_GAPS} selectedOptions={formData.knowledgeGaps} onChange={handleFieldChange} error={touched.knowledgeGaps ? errors.knowledgeGaps : undefined} customOptions={formData.knowledgeGapsCustom} onAddCustomOption={(option) => handleAddCustomOption('knowledgeGaps', 'knowledgeGapsCustom', option)} onRemoveCustomOption={(option) => handleRemoveCustomOption('knowledgeGaps', 'knowledgeGapsCustom', option)} />
                </div>
            );
            case 11: return (
                <div className="space-y-6">
                    <TextInput type="textarea" label="Дополнительная информация, которую вы хотели бы указать" name="additionalInfo" value={formData.additionalInfo} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.additionalInfo ? errors.additionalInfo : undefined} required />
                    <TextInput type="textarea" label="Ваши предложения по улучшению работы ЛДПР" name="suggestions" value={formData.suggestions} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.suggestions ? errors.suggestions : undefined} required />
                    <TextInput type="textarea" label="Какими талантами вы обладаете?" name="talents" value={formData.talents} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.talents ? errors.talents : undefined} required />
                    <TextInput type="textarea" label="Какими знаниями вы были бы готовы поделиться с коллегами?" name="knowledgeToShare" value={formData.knowledgeToShare} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.knowledgeToShare ? errors.knowledgeToShare : undefined} required />
                    <TextInput type="textarea" label="Что вы можете назвать своей СУПЕРсилой?" name="superpower" value={formData.superpower} onChange={handleFieldChange} onBlur={handleFieldBlur} error={touched.superpower ? errors.superpower : undefined} required />
                </div>
            );
            default: return null;
        }
    }
    
    if (isSubmitted) {
        return <SuccessPage onEdit={handleEditForm} />;
    }

    return (
        <div className="min-h-screen bg-white lg:bg-gray-50 flex flex-col font-sans lg:h-screen lg:overflow-hidden">
            {notification && (
                <div className={`fixed top-5 right-5 z-50 p-4 rounded-lg shadow-xl flex items-center text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} role="alert">
                    {notification.type === 'error' 
                        ? <AlertTriangle className="h-6 w-6 mr-3 shrink-0" /> 
                        : <Check className="h-6 w-6 mr-3 shrink-0" />}
                    <p className="font-semibold flex-grow">{notification.message}</p>
                    <button onClick={() => setNotification(null)} className="ml-4 p-1 rounded-full hover:bg-black/20" aria-label="Закрыть уведомление">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}
            <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col lg:flex-row lg:gap-6 lg:p-6 lg:h-full">
                <aside className="hidden lg:flex w-[380px] bg-slate-800 rounded-2xl text-white flex-col shrink-0 shadow-2xl overflow-hidden">
                    <div className="mb-10 px-8 pt-8">
                        <h1 className="text-3xl font-bold tracking-tight">Анкета депутата ЛДПР</h1>
                        <p className="text-slate-400 mt-2">Пройдите все шаги для завершения</p>
                    </div>
                    
                    <nav className="flex-grow overflow-y-auto pl-8 pr-4 pb-8 sidebar-scrollbar h-0" style={{ scrollbarGutter: 'stable' }}>
                        <ul className="space-y-2">
                            {SECTIONS.map((section, index) => {
                                const isCompleted = completedSteps[index];
                                const isActive = index === currentStep;
                                const isReachable = index === 0 || completedSteps[index - 1] || index <= currentStep;
                                const isPastAndIncomplete = !isCompleted && !isActive && index < currentStep;
                                const StepIcon = STEP_ICONS[index];

                                return (
                                    <li key={section.title}>
                                        <button
                                            onClick={() => isReachable && setCurrentStep(index)}
                                            disabled={!isReachable}
                                            className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center gap-4 ${
                                                isActive ? 'bg-blue-600/20' : isPastAndIncomplete ? 'bg-red-500/20' : isReachable ? 'hover:bg-slate-700' : ''
                                            } ${!isReachable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            aria-current={isActive ? 'step' : undefined}
                                        >
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border-2 transition-all duration-300 ${
                                                isActive 
                                                    ? 'bg-blue-600 border-blue-500 text-white' 
                                                    : isPastAndIncomplete
                                                    ? 'bg-red-500 border-red-400 text-white'
                                                    : isCompleted 
                                                    ? 'bg-green-500 border-green-400 text-white' 
                                                    : 'bg-slate-700 border-slate-600 text-slate-400'
                                            }`}>
                                                {isPastAndIncomplete ? <AlertTriangle className="h-6 w-6" /> : isCompleted && !isActive ? <Check className="h-6 w-6" /> : <StepIcon className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-grow">
                                                <p className={`text-sm ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>Шаг {index + 1}</p>
                                                <p className={`font-semibold ${isActive || isCompleted ? 'text-white' : 'text-slate-300'}`}>
                                                    {section.title}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                    <div className="px-8 py-4 mt-auto border-t border-slate-700">
                        <button
                            onClick={() => setIsClearConfirmOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-300 rounded-lg hover:bg-red-500/20 hover:text-red-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500"
                        >
                            <Trash2 className="h-4 w-4" />
                            Очистить форму
                        </button>
                    </div>
                </aside>
                
                <main className="flex-1 flex flex-col lg:bg-white lg:rounded-2xl lg:shadow-2xl lg:h-full lg:overflow-hidden">
                    <div className="lg:hidden px-4 sm:px-8 pt-6 pb-4 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-gray-100">
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Анкета депутата</h1>
                        </div>
                        <button
                            onClick={() => setIsClearConfirmOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                            aria-label="Очистить форму"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Очистить</span>
                        </button>
                    </div>
                    
                    <div className="lg:hidden">
                        <div className="overflow-x-auto py-4">
                            <ul ref={mobileStepperRef} className="flex items-center whitespace-nowrap px-4 sm:px-8">
                                {SECTIONS.map((section, index) => {
                                    const isCompleted = completedSteps[index];
                                    const isActive = index === currentStep;
                                    const isReachable = index === 0 || completedSteps[index - 1] || index <= currentStep;
                                    const isPastAndIncomplete = !isCompleted && !isActive && index < currentStep;
                                    const StepIcon = STEP_ICONS[index];

                                    return (
                                        <li key={section.title} data-step-index={index} className="flex items-center">
                                            <button
                                                onClick={() => isReachable && setCurrentStep(index)}
                                                disabled={!isReachable}
                                                className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border-2 transition-all duration-300 ${
                                                    isActive 
                                                        ? 'bg-blue-600 border-blue-500 text-white scale-110' 
                                                        : isPastAndIncomplete
                                                        ? 'bg-red-500 border-red-400 text-white'
                                                        : isCompleted 
                                                        ? 'bg-green-500 border-green-400 text-white' 
                                                        : 'bg-gray-200 border-gray-300 text-gray-500'
                                                } ${!isReachable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                aria-label={`Шаг ${index + 1}: ${section.title}`}
                                                aria-current={isActive ? 'step' : undefined}
                                            >
                                                 {isPastAndIncomplete ? <AlertTriangle className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                                            </button>
                                            {index < SECTIONS.length - 1 && (
                                                <div className={`h-1 w-10 mx-4 rounded transition-colors duration-300 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                
                    <div ref={contentRef} className="mobile-scrollbar-hide flex-grow overflow-y-auto px-4 sm:px-8 lg:p-8 lg:pr-4 h-0" style={{ scrollbarGutter: 'stable' }}>
                         <div className="mt-6 mb-8 lg:mt-0">
                          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">{SECTIONS[currentStep].title}</h2>
                          <p className="text-slate-500 mt-2">Раздел {currentStep + 1} из {SECTIONS.length}</p>
                        </div>
                        
                        <form onSubmit={(e) => e.preventDefault()} noValidate className="pb-24 lg:pb-0">
                            {renderCurrentStep()}
                        </form>
                    </div>

                    <div className="hidden lg:flex mt-auto pt-6 border-t border-slate-200 justify-between items-center shrink-0 px-4 sm:px-8 pb-4 sm:pb-8">
                        <div>
                            {currentStep > 0 && (
                                <button type="button" onClick={handleBack} className="px-6 py-3 text-base font-semibold rounded-lg flex items-center gap-2 transition-all shadow-sm bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">
                                    <ArrowLeft className="h-5 w-5" />
                                    Назад
                                </button>
                            )}
                        </div>
                        <div>
                            {currentStep < SECTIONS.length - 1 ? (
                                <button type="button" onClick={handleNext} className="px-6 py-3 text-base font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300">
                                    Вперед
                                    <ArrowRight className="h-5 w-5" />
                                </button>
                            ) : (
                                <button type="button" onClick={handleSubmit} disabled={!isFormValid} className={`px-6 py-3 text-base font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md bg-green-600 text-white focus:outline-none focus:ring-4 focus:ring-green-300 ${!isFormValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}>
                                    Завершить и скачать
                                    <Check className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
             <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-4 justify-between items-center shadow-top z-10">
                 {currentStep > 0 ? (
                    <button type="button" onClick={handleBack} className="px-4 py-3 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 flex-1">
                        <ArrowLeft className="h-5 w-5" />
                        <span>Назад</span>
                    </button>
                ) : <div className="flex-1"></div>}
                
                {currentStep < SECTIONS.length - 1 ? (
                    <button type="button" onClick={handleNext} className="px-4 py-3 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 flex-1">
                        <span>Вперед</span>
                        <ArrowRight className="h-5 w-5" />
                    </button>
                ) : (
                    <button type="button" onClick={handleSubmit} disabled={!isFormValid} className={`px-4 py-3 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md bg-green-600 text-white focus:outline-none focus:ring-4 focus:ring-green-300 flex-1 ${!isFormValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}>
                        <span>Завершить</span>
                        <Check className="h-5 w-5" />
                    </button>
                )}
            </div>
            <div className="hidden lg:block">
                <ConfirmationModal
                    isOpen={isClearConfirmOpen}
                    onClose={() => setIsClearConfirmOpen(false)}
                    onConfirm={handleClearForm}
                    title="Очистить форму?"
                >
                    <p>Вы уверены, что хотите полностью очистить анкету? Все введенные данные будут безвозвратно удалены. Это действие нельзя отменить.</p>
                </ConfirmationModal>
            </div>
            <div className="lg:hidden">
                <BottomSheet
                    isOpen={isClearConfirmOpen}
                    onClose={() => setIsClearConfirmOpen(false)}
                    onConfirm={handleClearForm}
                    title="Очистить форму?"
                >
                    <p>Вы уверены, что хотите полностью очистить анкету? Все введенные данные будут безвозвратно удалены. Это действие нельзя отменить.</p>
                </BottomSheet>
            </div>
        </div>
    );
};

export default RegistrationPage;