
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    User, BarChart3, Scale, Users, MessageCircle, Shield, Briefcase, 
    FileCheck, MoreHorizontal, Plus, Trash2, X, Check, ArrowLeft, ArrowRight, 
    AlertTriangle 
} from 'lucide-react';
import { initialFormData, REGIONS, LEGISLATION_STATUSES, REQUEST_TOPICS_CONFIG, REPRESENTATIVE_BODY_LEVELS, FORM_PDF_URL_KEY } from '../constants';
import type { FormData, LegislationItem, CitizenReceptions } from '../types';
import TextInput from '../components/TextInput';
import SearchableSelect from '../components/SearchableSelect';
import Select from '../components/Select';
import NumberInput from '../components/NumberInput';
import DateInput from '../components/DateInput';
import ConfirmationModal from '../components/ConfirmationModal';
import BottomSheet from '../components/BottomSheet';
import SuccessPage from './SuccessPage';
import MonthSelector from '../components/MonthSelector';
import LinkInputList from '../components/LinkInputList';
import { useRemoteData } from '../context/RemoteDataContext';
import { reportApi } from '../services/api';
import { validateField, validateLegislationItem, validateProjectItem, validateLdprOrder } from '../utils/validation';

// Section definitions aligned with Report structure
const SECTIONS = [
    { title: "Общая информация", id: 'general' },
    { title: "Деятельность и связи", id: 'activity_links' },
    { title: "Законотворчество", id: 'legislation' },
    { title: "Статистика обращений", id: 'stats' },
    { title: "Примеры обращений", id: 'examples' },
    { title: "Поддержка СВО", id: 'svo' },
    { title: "Проектная деятельность", id: 'projects' },
    { title: "Поручения ЛДПР", id: 'orders' },
    { title: "Иное", id: 'other' }
];

const STEP_ICONS = [
    User,           // General
    BarChart3,      // Activity/Links/Stats
    Scale,          // Legislation
    Users,          // Citizen Stats
    MessageCircle,  // Citizen Examples
    Shield,         // SVO
    Briefcase,      // Projects
    FileCheck,      // Orders
    MoreHorizontal  // Other
];

const FORM_DATA_KEY = 'ldpr_report_draft';
const FORM_STEP_KEY = 'ldpr_report_step';
const FORM_INTERACTED_KEY = 'ldpr_report_interacted';
const FORM_SUBMITTED_KEY = 'ldpr_report_submitted';

// --- Dynamic Item Components ---

const StringListItem = React.memo(({ item, index, onChange, onRemove, onBlur, error, placeholder }: { item: string, index: number, onChange: (index: number, value: string) => void, onRemove: (index: number) => void, onBlur: (index: number) => void, error: string | undefined, placeholder: string }) => {
    return (
        <div className="flex items-start gap-2 mb-3">
            <div className="flex-grow">
                <TextInput 
                    name={`item-${index}`} 
                    value={item} 
                    onChange={(_, val) => onChange(index, val)} 
                    onBlur={() => onBlur(index)} 
                    placeholder={placeholder} 
                    error={error}
                />
            </div>
            <button type="button" onClick={() => onRemove(index)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shrink-0 mt-0.5">
                <Trash2 className="h-5 w-5" />
            </button>
        </div>
    );
});

const LegislationCard = React.memo(({ item, index, onChange, onRemove, onBlur, errors, touched }: { item: LegislationItem, index: number, onChange: (index: number, field: keyof LegislationItem, value: any) => void, onRemove: (index: number) => void, onBlur: (index: number, field: string) => void, errors: Record<string, string | undefined>, touched: Record<string, boolean> }) => {
    
    return (
        <div className="p-4 border border-slate-200 rounded-lg bg-white relative mb-4 shadow-sm">
            <button type="button" onClick={() => onRemove(index)} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="h-5 w-5" />
            </button>
            <h4 className="font-semibold mb-4 text-gray-700">Инициатива #{index + 1}</h4>
            <div className="space-y-5">
                <TextInput 
                    label="Название законопроекта" 
                    name={`leg_title_${index}`} 
                    value={item.title} 
                    onChange={(_, val) => onChange(index, 'title', val)} 
                    onBlur={() => onBlur(index, 'title')}
                    error={touched[`legislation.${index}.title`] ? errors[`legislation.${index}.title`] : undefined}
                    required
                />
                <TextInput 
                    type="textarea" 
                    label="Краткое описание" 
                    name={`leg_summary_${index}`} 
                    value={item.summary} 
                    onChange={(_, val) => onChange(index, 'summary', val)}
                    onBlur={() => onBlur(index, 'summary')}
                    error={touched[`legislation.${index}.summary`] ? errors[`legislation.${index}.summary`] : undefined}
                    required
                />
                <Select 
                    label="Результат рассмотрения" 
                    name={`leg_status_${index}`} 
                    options={LEGISLATION_STATUSES} 
                    selected={item.status} 
                    onChange={(_, val) => onChange(index, 'status', val)}
                    onBlur={() => onBlur(index, 'status')}
                    error={touched[`legislation.${index}.status`] ? errors[`legislation.${index}.status`] : undefined}
                    required
                />
                {item.status === 'Отклонено' && (
                    <TextInput 
                        type="textarea" 
                        label="Причина отказа" 
                        name={`leg_reason_${index}`} 
                        value={item.rejection_reason} 
                        onChange={(_, val) => onChange(index, 'rejection_reason', val)}
                        onBlur={() => onBlur(index, 'rejection_reason')}
                        error={touched[`legislation.${index}.rejection_reason`] ? errors[`legislation.${index}.rejection_reason`] : undefined}
                        required
                    />
                )}
                
                <LinkInputList 
                    links={item.links}
                    onChange={(newLinks) => onChange(index, 'links', newLinks)}
                    label="Ссылки на новость о законопроекте"
                />
            </div>
        </div>
    );
});

const GenericItemCard = React.memo(({ title, index, children, onRemove }: { title: string, index: number, children: React.ReactNode, onRemove: () => void }) => (
    <div className="p-4 border border-slate-200 rounded-lg bg-white relative mb-4 shadow-sm">
        <button type="button" onClick={onRemove} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="h-5 w-5" />
        </button>
        <h4 className="font-semibold mb-4 text-gray-700">{title} #{index + 1}</h4>
        <div className="space-y-5">
            {children}
        </div>
    </div>
));

const AddItemButton = ({ onClick, children }: { onClick: () => void, children?: React.ReactNode }) => (
    <button type="button" onClick={onClick} className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500">
        <Plus className="h-4 w-4" /> {children}
    </button>
);

const RegistrationPage: React.FC = () => {
  const { userData, isStandalone, isLoading } = useRemoteData(); // Добавили isLoading
  const [hasAutoFilled, setHasAutoFilled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => {
        try {
            const saved = window.localStorage.getItem(FORM_DATA_KEY);
            return saved ? JSON.parse(saved) : initialFormData;
        } catch {
            return initialFormData;
        }
    });
    const [pdfUrl, setPdfUrl] = useState<string | null>(() => {
  try {
    const saved = window.localStorage.getItem(FORM_PDF_URL_KEY);
    return saved || null;
  } catch {
    return null;
  }
});
  
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [notification, setNotification] = useState<{ message: React.ReactNode; type: 'success' | 'error' } | null>(null);
    const [currentStep, setCurrentStep] = useState<number>(() => {
        const saved = window.localStorage.getItem(FORM_STEP_KEY);
        return saved ? JSON.parse(saved) : 0;
    });
    
    // Tracks if the user has physically interacted with a step (typed, changed options, added items)
    const [interactedSteps, setInteractedSteps] = useState<boolean[]>(() => {
        const saved = window.localStorage.getItem(FORM_INTERACTED_KEY);
        return saved ? JSON.parse(saved) : Array(SECTIONS.length).fill(false);
    });

    // Tracks if the user tried to submit the form globally
    const [isFormAttempted, setIsFormAttempted] = useState(false);

    const [isSubmitted, setIsSubmitted] = useState<boolean>(() => {
        try {
            const saved = window.localStorage.getItem(FORM_SUBMITTED_KEY);
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    const contentRef = useRef<HTMLDivElement>(null);
    const mobileStepperRef = useRef<HTMLDivElement>(null);
    const stepRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const desktopStepRefs = useRef<(HTMLLIElement | null)[]>([]);
    const appContainerRef = useRef<HTMLDivElement>(null);
    const formDataRef = useRef(formData);

  useEffect(() => {
    console.log('useRemoteData состояние:', { userData, isStandalone, isLoading });
    
    if (isLoading) {
      console.log('Данные ещё загружаются...');
      return;
    }
    
    if (!userData?.deputyForm) {
      console.log('Нет данных deputyForm для автозаполнения');
      return;
    }

    // Защита от повторного автозаполнения
    if (hasAutoFilled) {
      console.log('Автозаполнение уже выполнено');
      return;
    }

    const deputyForm = userData.deputyForm;
    console.log('Начинаю автозаполнение из:', deputyForm);

      setFormData(prev => {
        const newData = { ...prev };
        const general = newData.general_info;

        // ФИО
        if (!general.full_name && deputyForm.lastName && deputyForm.firstName && deputyForm.middleName) {
          general.full_name = `${deputyForm.lastName} ${deputyForm.firstName} ${deputyForm.middleName}`;
        }
        if (!general.full_name && deputyForm.lastName && deputyForm.firstName && !deputyForm.middleName) {
          general.full_name = `${deputyForm.lastName} ${deputyForm.firstName}`;
        }

        // Регион
        if (!general.region && deputyForm.region) {
          general.region = deputyForm.region;
        }

        // Уровень представительства (преобразуем из английского в русский)
        if (!general.representative_level && deputyForm.representativeBodyLevel) {
            general.representative_level = deputyForm.representativeBodyLevel
        }

        // Название представительного органа
        if (!general.authority_name && deputyForm.representativeBodyName) {
          general.authority_name = deputyForm.representativeBodyName;
        }

        // Должность
        if (!general.position && deputyForm.representativeBodyPosition) {
          general.position = deputyForm.representativeBodyPosition;
        }

        // Должность во фракции ЛДПР
        if (!general.ldpr_position && deputyForm.partyPosition) {
          general.ldpr_position = deputyForm.partyPosition;
        }

        if (!general.committees.length && deputyForm.committeeName) {
          general.committees = [deputyForm.committeeName];
        }
        if (general.links.length === 0 || !general.links.length[0]) {
          const links = [];
          if (deputyForm.vkPage) links.push(deputyForm.vkPage);
          if (deputyForm.vkGroup) links.push(deputyForm.vkGroup);
          if (deputyForm.telegramChannel) links.push(deputyForm.telegramChannel);
          if (deputyForm.personalSite) links.push(deputyForm.personalSite);
          if (links.length > 0) {
            general.links = links;
          }
        }

        return newData;
      });
    setHasAutoFilled(true);
    console.log('Автозаполнение завершено');
    
  }, [userData, isStandalone, isLoading, hasAutoFilled]);
    
    
    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    useEffect(() => {
        const appContainer = appContainerRef.current;
        if (!appContainer) return;
        const setAppHeight = () => { appContainer.style.height = `${window.innerHeight}px`; };
        setAppHeight();
        window.addEventListener('resize', setAppHeight);
        return () => window.removeEventListener('resize', setAppHeight);
    }, [isSubmitted]);

    useEffect(() => { formDataRef.current = formData; }, [formData]);

    useEffect(() => {
        try { window.localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData)); } 
        catch (e) { console.error('Storage error', e); }
    }, [formData]);

    useEffect(() => { window.localStorage.setItem(FORM_STEP_KEY, JSON.stringify(currentStep)); }, [currentStep]);
    
    useEffect(() => {
        window.localStorage.setItem(FORM_INTERACTED_KEY, JSON.stringify(interactedSteps));
    }, [interactedSteps]);

    useEffect(() => {
        // Autoscroll mobile stepper
        if (mobileStepperRef.current) {
            const activeStepEl = stepRefs.current[currentStep];
            if (activeStepEl) {
                const stepperRect = mobileStepperRef.current.getBoundingClientRect();
                const stepRect = activeStepEl.getBoundingClientRect();
                
                const scrollLeft = mobileStepperRef.current.scrollLeft;
                const centerPos = stepRect.left + stepRect.width / 2 - stepperRect.left;
                const targetScroll = scrollLeft + centerPos - stepperRect.width / 2;

                mobileStepperRef.current.scrollTo({
                    left: targetScroll,
                    behavior: 'smooth',
                });
            }
        }
        // Scroll sidebar on desktop
        const desktopEl = desktopStepRefs.current[currentStep];
        if (desktopEl) desktopEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentStep]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), notification.type === 'error' ? 8000 : 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Validation Logic with Touch Trigger
    const validateAndHighlightStep = (step: number) => {
        const data = formData;
        const newErrors: Record<string, string | undefined> = {};
        const newTouched: Record<string, boolean> = {};
        let isValid = true;

        const check = (path: string) => {
            newTouched[path] = true; // Mark as touched to trigger Red Highlight
            const err = validateField(path, data);
            if (err) {
                newErrors[path] = err;
                isValid = false;
            }
        };

        if (step === 0) {
            check('general_info.full_name');
            check('general_info.district');
            check('general_info.region');
            check('general_info.representative_level');
            check('general_info.authority_name');
            check('general_info.term_start');
            check('general_info.term_end'); 
            check('general_info.position');
            check('general_info.ldpr_position');
        }
        if (step === 1) {
            check('general_info.sessions_attended.total');
            check('general_info.sessions_attended.attended');
            check('general_info.sessions_attended.committee_total');
            check('general_info.sessions_attended.committee_attended');
            check('general_info.sessions_attended.ldpr_total');
            check('general_info.sessions_attended.ldpr_attended');
        }
        if (step === 2) {
            data.legislation.forEach((item, idx) => {
                const errTitle = !item.title ? 'Обязательно' : undefined;
                const errSum = !item.summary ? 'Обязательно' : undefined;
                const errStat = !item.status ? 'Обязательно' : undefined;
                const errRej = item.status === 'Отклонено' && !item.rejection_reason ? 'Обязательно' : undefined;
                
                if(errTitle) { newErrors[`legislation.${idx}.title`] = errTitle; newTouched[`legislation.${idx}.title`] = true; isValid = false; }
                if(errSum) { newErrors[`legislation.${idx}.summary`] = errSum; newTouched[`legislation.${idx}.summary`] = true; isValid = false; }
                if(errStat) { newErrors[`legislation.${idx}.status`] = errStat; newTouched[`legislation.${idx}.status`] = true; isValid = false; }
                if(errRej) { newErrors[`legislation.${idx}.rejection_reason`] = errRej; newTouched[`legislation.${idx}.rejection_reason`] = true; isValid = false; }
            });
        }
        if (step === 3) {
            check('citizen_requests.personal_meetings');
            check('citizen_requests.responses');
            check('citizen_requests.official_queries');
            REQUEST_TOPICS_CONFIG.forEach(t => {
                check(`citizen_requests.requests.${t.key}`);
            });
        }
        if (step === 4) {
             data.citizen_requests.examples.forEach((item, idx) => {
                 if(!item.text) { newErrors[`citizen_requests.examples.${idx}.text`] = 'Обязательно'; newTouched[`citizen_requests.examples.${idx}.text`] = true; isValid = false; }
             });
        }
        if (step === 5) {
             data.svo_support.projects.forEach((item, idx) => {
                 if(!item.text) { newErrors[`svo_support.projects.${idx}.text`] = 'Обязательно'; newTouched[`svo_support.projects.${idx}.text`] = true; isValid = false; }
             });
        }
        if (step === 6) {
             data.project_activity.forEach((item, idx) => {
                 if(!item.name) { newErrors[`project_activity.${idx}.name`] = 'Обязательно'; newTouched[`project_activity.${idx}.name`] = true; isValid = false; }
                 if(!item.result) { newErrors[`project_activity.${idx}.result`] = 'Обязательно'; newTouched[`project_activity.${idx}.result`] = true; isValid = false; }
             });
        }
        if (step === 7) {
             data.ldpr_orders.forEach((item, idx) => {
                 if(!item.instruction) { newErrors[`ldpr_orders.${idx}.instruction`] = 'Обязательно'; newTouched[`ldpr_orders.${idx}.instruction`] = true; isValid = false; }
                 if(!item.action) { newErrors[`ldpr_orders.${idx}.action`] = 'Обязательно'; newTouched[`ldpr_orders.${idx}.action`] = true; isValid = false; }
             });
        }

        setErrors(prev => ({ ...prev, ...newErrors }));
        setTouched(prev => ({ ...prev, ...newTouched }));

        return isValid;
    };

    // Trigger full step validation only if the form has been attempted (Submit clicked)
    useEffect(() => {
        if (isFormAttempted) {
            validateAndHighlightStep(currentStep);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, isFormAttempted]);


    // --- Validation Logic (Pure Check) ---

    const isStepValid = useCallback((index: number, data: FormData): boolean => {
        // Step 0: General
        if (index === 0) {
            if (validateField('general_info.full_name', data) ||
                validateField('general_info.district', data) ||
                validateField('general_info.region', data) ||
                validateField('general_info.representative_level', data) ||
                validateField('general_info.authority_name', data) ||
                validateField('general_info.term_start', data) ||
                validateField('general_info.term_end', data) || 
                validateField('general_info.position', data) ||
                validateField('general_info.ldpr_position', data)) return false;
            return true;
        }
        // Step 1: Activity & Links (Session stats validation)
        if (index === 1) {
            if (validateField('general_info.sessions_attended.total', data) ||
                validateField('general_info.sessions_attended.attended', data) ||
                validateField('general_info.sessions_attended.committee_total', data) ||
                validateField('general_info.sessions_attended.committee_attended', data) ||
                validateField('general_info.sessions_attended.ldpr_total', data) ||
                validateField('general_info.sessions_attended.ldpr_attended', data)) return false;
            return true;
        }
        // Step 2: Legislation - Optional if empty
        if (index === 2) {
             if (data.legislation.length === 0) return true;
             for (const item of data.legislation) {
                if (validateLegislationItem(item)) return false;
            }
            return true;
        }
        // Step 3: Stats - All fields required
        if (index === 3) {
            if (validateField('citizen_requests.personal_meetings', data) ||
                validateField('citizen_requests.responses', data) ||
                validateField('citizen_requests.official_queries', data)) return false;
            
            // Check request topics
            const topicKeys = REQUEST_TOPICS_CONFIG.map(t => t.key);
            for (const key of topicKeys) {
                if (validateField(`citizen_requests.requests.${key}`, data)) return false;
            }
            return true;
        }
        // Step 4: Examples - Optional if empty
        if (index === 4) {
            if (data.citizen_requests.examples.length === 0) return true;
            for (const ex of data.citizen_requests.examples) {
                if (!ex.text || !ex.text.trim()) return false;
            }
            return true;
        }
        // Step 5: SVO - Optional if empty
        if (index === 5) {
             if (data.svo_support.projects.length === 0) return true;
             for (const proj of data.svo_support.projects) {
                if (!proj.text || !proj.text.trim()) return false;
            }
            return true;
        }
        // Step 6: Projects - Optional if empty
        if (index === 6) {
             if (data.project_activity.length === 0) return true;
             for (const item of data.project_activity) {
                if (validateProjectItem(item)) return false;
            }
            return true;
        }
        // Step 7: Orders - Optional if empty
        if (index === 7) {
             if (data.ldpr_orders.length === 0) return true;
             for (const item of data.ldpr_orders) {
                if (validateLdprOrder(item)) return false;
            }
            return true;
        }

        return true;
    }, []);

    // Checks if the step is actually empty (for optional steps)
    const isStepEmpty = useCallback((index: number, data: FormData): boolean => {
        if (index === 2) return data.legislation.length === 0;
        if (index === 4) return data.citizen_requests.examples.length === 0;
        if (index === 5) return data.svo_support.projects.length === 0;
        if (index === 6) return data.project_activity.length === 0;
        if (index === 7) return data.ldpr_orders.length === 0;
        if (index === 8) return !data.other_info;
        return false;
    }, []);

    const markStepAsInteracted = useCallback(() => {
        setInteractedSteps(prev => {
            if (prev[currentStep]) return prev;
            const next = [...prev];
            next[currentStep] = true;
            return next;
        });
    }, [currentStep]);

    const handleFieldBlur = useCallback((fieldPath: string) => {
        setTouched(prev => ({ ...prev, [fieldPath]: true }));
        const error = validateField(fieldPath, formDataRef.current);
        setErrors(prev => ({ ...prev, [fieldPath]: error }));
        markStepAsInteracted();
    }, [markStepAsInteracted]);

    // --- Handlers ---

    const handleNext = () => {
        // Validate current step and highlight errors only if user interacted
        if (interactedSteps[currentStep]) {
            validateAndHighlightStep(currentStep);
        }
        
        if (currentStep < SECTIONS.length - 1) {
            setCurrentStep(p => p + 1);
            contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        // Validate on back to show errors if leaving incomplete and touched
        if (interactedSteps[currentStep]) {
            validateAndHighlightStep(currentStep);
        }

        if (currentStep > 0) {
            setCurrentStep(p => p - 1);
            contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const handleStepClick = (index: number) => {
        // Highlight errors on the step we are leaving if touched
        if (interactedSteps[currentStep]) {
            validateAndHighlightStep(currentStep);
        }
        setCurrentStep(index);
    };

    const handleGeneralChange = (field: string, value: any) => {
        markStepAsInteracted();
        setFormData(p => ({ ...p, general_info: { ...p.general_info, [field]: value } }));
        if (touched[`general_info.${field}`]) {
            setErrors(prev => ({ ...prev, [`general_info.${field}`]: validateField(`general_info.${field}`, { ...formData, general_info: { ...formData.general_info, [field]: value } }) }));
        }
    };

    // SMART STATISTICS VALIDATION
    const handleStatsChange = (field: string, value: any) => {
        markStepAsInteracted();
        // 1. Update State immediately
        const currentStats = formData.general_info.sessions_attended;
        const newStats = { ...currentStats, [field]: value };
        
        setFormData(p => ({
            ...p,
            general_info: {
                ...p.general_info,
                sessions_attended: newStats
            }
        }));

        // 2. Identify the Pair (Attended <-> Total)
        const pairs = [
            { att: 'attended', tot: 'total' },
            { att: 'committee_attended', tot: 'committee_total' },
            { att: 'ldpr_attended', tot: 'ldpr_total' }
        ];

        const pair = pairs.find(p => p.att === field || p.tot === field);
        if (!pair) return;

        // 3. Compare values reactively
        // Use value from args if it matches the current field, otherwise look up in newStats
        const attValStr = field === pair.att ? value : newStats[pair.att];
        const totValStr = field === pair.tot ? value : newStats[pair.tot];

        const attVal = parseInt(attValStr) || 0;
        const totVal = parseInt(totValStr) || 0;
        
        const attPath = `general_info.sessions_attended.${pair.att}`;

        // 4. Set Logic Error Immediately if violation
        // Only show if Total is > 0 (user has started entering comparison basis)
        if (totVal > 0 && attVal > totVal) {
            setErrors(prev => ({ ...prev, [attPath]: 'Не может быть больше общего' }));
            // We force 'touched' here so the error shows up immediately as they type
            setTouched(prev => ({ ...prev, [attPath]: true }));
        } else {
            // 5. Clear Logic Error Immediately if fixed
            setErrors(prev => {
                const currentError = prev[attPath];
                // Only clear if the error is specifically the Logic error.
                // We don't want to accidentally clear "Required" if handleFieldBlur set it.
                // But since "Required" usually happens on Blur, and we are Typing here, 
                // clearing "Greater than" is safe.
                if (currentError === 'Не может быть больше общего') {
                    const next = { ...prev };
                    delete next[attPath];
                    return next;
                }
                return prev;
            });
        }
    };

    const updateList = (path: string, index: number, field: string, value: any) => {
        markStepAsInteracted();
        setFormData(prev => {
            const keys = path.split('.');
            if (keys.length === 1) {
                const key = keys[0] as keyof FormData;
                const list = [...(prev[key] as any[])];
                // Handle primitive strings vs objects
                if (field) {
                    list[index] = { ...list[index], [field]: value };
                } else {
                    list[index] = value;
                }
                return { ...prev, [key]: list };
            } else if (keys.length === 2) {
                const [parent, child] = keys as [keyof FormData, string];
                const parentObj = prev[parent] as any;
                const list = [...(parentObj[child] as any[])];
                // Handle primitive strings vs objects
                if (field) {
                    list[index] = { ...list[index], [field]: value };
                } else {
                    list[index] = value;
                }
                return { ...prev, [parent]: { ...parentObj, [child]: list } };
            }
            return prev;
        });
        const errKey = `${path}.${index}.${field}`;
        if (errors[errKey]) setErrors(p => { const n = {...p}; delete n[errKey]; return n; });
    };

    const addItem = (path: string, item: any) => {
        markStepAsInteracted();
        setFormData(prev => {
             const keys = path.split('.');
             if (keys.length === 1) {
                 const key = keys[0] as keyof FormData;
                 return { ...prev, [key]: [...(prev[key] as any[]), item] };
             } else if (keys.length === 2) {
                 const [parent, child] = keys as [keyof FormData, string];
                 const parentObj = prev[parent] as any;
                 return { ...prev, [parent]: { ...parentObj, [child]: [...(parentObj[child] as any[]), item] } };
             }
             return prev;
        });
    };

    const removeItem = (path: string, index: number) => {
        markStepAsInteracted();
        setFormData(prev => {
             const keys = path.split('.');
             if (keys.length === 1) {
                 const key = keys[0] as keyof FormData;
                 return { ...prev, [key]: (prev[key] as any[]).filter((_, i) => i !== index) };
             } else if (keys.length === 2) {
                 const [parent, child] = keys as [keyof FormData, string];
                 const parentObj = prev[parent] as any;
                 const list = parentObj[child] as any[];
                 return { ...prev, [parent]: { ...parentObj, [child]: list.filter((_, i) => i !== index) } };
             }
             return prev;
        });
    };

    const handleSubmit = async () => {
    setIsFormAttempted(true);
    setSubmitError(null);
    
    // Валидация всех шагов
    let allValid = true;
    for (let i = 0; i < SECTIONS.length; i++) {
      if (!isStepValid(i, formData)) allValid = false;
    }

    if (!allValid) {
      setNotification({ 
        message: 'В анкете есть незаполненные обязательные поля. Проверьте разделы, отмеченные красным.', 
        type: 'error' 
      });
      validateAndHighlightStep(currentStep);
      return;
    }

    setIsSubmitting(true);

    try {
      // Подготавливаем данные для отправки
      const submissionData = {
        user_id: userData?.userId || 0,
        data: formData,
      };

      console.log('Отправка данных для создания PDF:', submissionData);

      // Отправляем запрос на создание PDF
      const result = await reportApi.createPdfReport(submissionData);

      if (result.status === 'Success') {
        // Получаем URL PDF файла
        const pdfUrl = result.message;
        setPdfUrl(pdfUrl);
        
        setNotification({ 
          message: (
            <div>
              <p className="font-bold">PDF отчёт успешно создан!</p>
              <p className="text-sm mt-1">Начинается скачивание файла...</p>
            </div>
          ), 
          type: 'success' 
        });
        
        // Автоматически скачиваем PDF
        await handleDownloadPdf(pdfUrl);
        
        // Сохраняем факт успешной отправки
        window.localStorage.setItem(FORM_SUBMITTED_KEY, 'true');
        window.localStorage.setItem(FORM_PDF_URL_KEY, pdfUrl); // Сохраняем URL для повторного скачивания
        setIsSubmitted(true);
        
      } else {
        throw new Error(result.message || 'Неизвестная ошибка сервера');
      }
    } catch (error: any) {
      console.error('Ошибка при создании PDF:', error);
      setSubmitError(error.message || 'Ошибка при создании PDF отчёта');
      setNotification({ 
        message: `Ошибка: ${error.message || 'Не удалось создать PDF файл'}`,
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (url?: string) => {
    const pdfUrlToDownload = url || pdfUrl;
    if (!pdfUrlToDownload) return;

    setIsDownloading(true);
    try {
      const filename = `Отчет_ЛДПР_${formData.general_info.full_name || 'депутата'}_${new Date().toLocaleDateString('ru-RU')}.pdf`;
      await reportApi.downloadPdf(pdfUrlToDownload, filename);
      
      setNotification({
        message: 'PDF файл успешно скачан!',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Ошибка скачивания PDF:', error);
      setNotification({
        message: `Ошибка при скачивании PDF: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditForm = useCallback(() => {
    try {
      window.localStorage.removeItem(FORM_SUBMITTED_KEY);
      window.localStorage.removeItem(FORM_PDF_URL_KEY);
      setIsSubmitted(false);
      setPdfUrl(null);
      setNotification(null);
    } catch (e) { console.error(e); }
  }, []);

    const handleClearForm = useCallback(() => {
        setIsClearConfirmOpen(false);
        setFormData(initialFormData);
        setCurrentStep(0);
        setInteractedSteps(Array(SECTIONS.length).fill(false));
        setIsFormAttempted(false);
        setErrors({});
        setTouched({});
        try {
            window.localStorage.removeItem(FORM_DATA_KEY);
            window.localStorage.removeItem(FORM_STEP_KEY);
            window.localStorage.removeItem(FORM_INTERACTED_KEY);
            window.localStorage.removeItem(FORM_SUBMITTED_KEY);
            setIsSubmitted(false);
        } catch (e) { console.error(e); }
        setNotification({ message: 'Форма очищена', type: 'success' });
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);



    // --- Render Steps ---

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 0: return (
                <div className="space-y-6">
                    <TextInput label="ФИО депутата" name="full_name" value={formData.general_info.full_name} onChange={(_, v) => handleGeneralChange('full_name', v)} onBlur={() => handleFieldBlur('general_info.full_name')} error={touched['general_info.full_name'] ? errors['general_info.full_name'] : undefined} required />
                    <TextInput label="Избирательный округ" name="district" value={formData.general_info.district} onChange={(_, v) => handleGeneralChange('district', v)} onBlur={() => handleFieldBlur('general_info.district')} error={touched['general_info.district'] ? errors['general_info.district'] : undefined} required />
                    <SearchableSelect label="Субъект РФ" name="region" options={REGIONS} selected={formData.general_info.region} onChange={(_, v) => handleGeneralChange('region', v)} onBlur={() => handleFieldBlur('general_info.region')} error={touched['general_info.region'] ? errors['general_info.region'] : undefined} required />
                    <Select label="Уровень представительства" name="representative_level" options={REPRESENTATIVE_BODY_LEVELS} selected={formData.general_info.representative_level} onChange={(_, v) => handleGeneralChange('representative_level', v)} onBlur={() => handleFieldBlur('general_info.representative_level')} error={touched['general_info.representative_level'] ? errors['general_info.representative_level'] : undefined} required />
                    <TextInput label="Представительный орган власти" name="authority_name" value={formData.general_info.authority_name} onChange={(_, v) => handleGeneralChange('authority_name', v)} onBlur={() => handleFieldBlur('general_info.authority_name')} error={touched['general_info.authority_name'] ? errors['general_info.authority_name'] : undefined} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DateInput label="Начало полномочий" name="term_start" value={formData.general_info.term_start} onChange={(_, v) => handleGeneralChange('term_start', v)} onBlur={() => handleFieldBlur('general_info.term_start')} error={touched['general_info.term_start'] ? errors['general_info.term_start'] : undefined} required />
                        <DateInput label="Окончание полномочий" name="term_end" value={formData.general_info.term_end} onChange={(_, v) => handleGeneralChange('term_end', v)} onBlur={() => handleFieldBlur('general_info.term_end')} error={touched['general_info.term_end'] ? errors['general_info.term_end'] : undefined} required />
                    </div>
                    <TextInput label="Должность" name="position" value={formData.general_info.position} onChange={(_, v) => handleGeneralChange('position', v)} onBlur={() => handleFieldBlur('general_info.position')} error={touched['general_info.position'] ? errors['general_info.position'] : undefined} required />
                    <TextInput label="Должность во фракции ЛДПР" name="ldpr_position" value={formData.general_info.ldpr_position} onChange={(_, v) => handleGeneralChange('ldpr_position', v)} onBlur={() => handleFieldBlur('general_info.ldpr_position')} error={touched['general_info.ldpr_position'] ? errors['general_info.ldpr_position'] : undefined} required />
                </div>
            );
            case 1: return (
                <div className="space-y-8">
                     <div>
                        <LinkInputList 
                            links={formData.general_info.links}
                            onChange={(newLinks) => {
                                markStepAsInteracted();
                                setFormData(p => ({...p, general_info: {...p.general_info, links: newLinks}}));
                            }}
                            label="Ссылки на соцсети и сайт"
                            addButtonLabel="Добавить ссылку"
                        />
                    </div>
                     <div>
                        <label className="block text-base font-semibold text-gray-800 mb-3">Комитеты / Комиссии</label>
                        {formData.general_info.committees.map((com, idx) => (
                            <StringListItem 
                                key={idx} index={idx} item={com} 
                                onChange={(i, v) => updateList('general_info.committees', i, '', v)} 
                                onRemove={(i) => removeItem('general_info.committees', i)} 
                                onBlur={() => {}} 
                                error={undefined} 
                                placeholder="Комитет по..." 
                            />
                        ))}
                        <AddItemButton onClick={() => addItem('general_info.committees', '')}>Добавить комитет</AddItemButton>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-4 text-gray-900">Статистика посещаемости (Посещено / Всего)</h4>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {[
                                { label: 'Коллегиальный орган', att: 'attended', tot: 'total' },
                                { label: 'Комитеты / Комиссии', att: 'committee_attended', tot: 'committee_total' },
                                { label: 'Фракция ЛДПР', att: 'ldpr_attended', tot: 'ldpr_total' }
                            ].map((row, i, arr) => (
                                <div key={i} className={`p-5 md:p-6 ${i !== arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <label className="block text-base font-semibold text-gray-800 mb-2">{row.label}</label>
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                             <NumberInput 
                                                label="" name={`s_${row.att}`} placeholder="Посещено" 
                                                value={(formData.general_info.sessions_attended as any)[row.att]} 
                                                onChange={(_, v) => handleStatsChange(row.att, v)} 
                                                onBlur={() => handleFieldBlur(`general_info.sessions_attended.${row.att}`)}
                                                error={touched[`general_info.sessions_attended.${row.att}`] ? errors[`general_info.sessions_attended.${row.att}`] : undefined} 
                                            />
                                        </div>
                                        <div className="flex items-center justify-center h-[50px] text-gray-300 font-light text-2xl">/</div>
                                        <div className="flex-1">
                                            <NumberInput 
                                                label="" name={`s_${row.tot}`} placeholder="Всего" 
                                                value={(formData.general_info.sessions_attended as any)[row.tot]} 
                                                onChange={(_, v) => handleStatsChange(row.tot, v)}
                                                onBlur={() => handleFieldBlur(`general_info.sessions_attended.${row.tot}`)}
                                                error={touched[`general_info.sessions_attended.${row.tot}`] ? errors[`general_info.sessions_attended.${row.tot}`] : undefined} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
            case 2: return (
                <div>
                    {formData.legislation.length === 0 && (
                        <div className="text-center py-8 px-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 mb-4">
                            <p>Для добавления законодательной инициативы нажмите кнопку ниже</p>
                        </div>
                    )}
                    {formData.legislation.map((item, idx) => (
                        <LegislationCard 
                            key={idx} index={idx} item={item} 
                            onChange={(i, f, v) => updateList('legislation', i, f as string, v)} 
                            onRemove={(i) => removeItem('legislation', i)} 
                            onBlur={(i, f) => {}} // simplified
                            errors={errors} touched={touched}
                        />
                    ))}
                    <AddItemButton onClick={() => addItem('legislation', { title: '', summary: '', status: '', links: [''] })}>Добавить инициативу</AddItemButton>
                </div>
            );
            case 3: return (
                <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <NumberInput label="Личные приемы" name="pm" value={formData.citizen_requests.personal_meetings} onChange={(_, v) => {markStepAsInteracted(); setFormData(p => ({...p, citizen_requests: {...p.citizen_requests, personal_meetings: v}}))}} onBlur={() => handleFieldBlur('citizen_requests.personal_meetings')} error={touched['citizen_requests.personal_meetings'] ? errors['citizen_requests.personal_meetings'] : undefined} required />
                        <NumberInput label="Ответы" name="resp" value={formData.citizen_requests.responses} onChange={(_, v) => {markStepAsInteracted(); setFormData(p => ({...p, citizen_requests: {...p.citizen_requests, responses: v}}))}} onBlur={() => handleFieldBlur('citizen_requests.responses')} error={touched['citizen_requests.responses'] ? errors['citizen_requests.responses'] : undefined} required />
                        <NumberInput label="Запросы" name="off" value={formData.citizen_requests.official_queries} onChange={(_, v) => {markStepAsInteracted(); setFormData(p => ({...p, citizen_requests: {...p.citizen_requests, official_queries: v}}))}} onBlur={() => handleFieldBlur('citizen_requests.official_queries')} error={touched['citizen_requests.official_queries'] ? errors['citizen_requests.official_queries'] : undefined} required />
                    </div>
                    
                    <MonthSelector 
                        value={formData.citizen_requests.citizen_day_receptions}
                        onChange={(key, isActive) => {
                            markStepAsInteracted();
                            setFormData(p => ({
                                ...p, 
                                citizen_requests: {
                                    ...p.citizen_requests, 
                                    citizen_day_receptions: {
                                        ...p.citizen_requests.citizen_day_receptions, 
                                        [key]: isActive ? 1 : 0
                                    }
                                }
                            }));
                        }}
                    />

                    <div>
                         <h4 className="font-bold text-gray-800 mb-3 text-base">Тематика обращений</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {REQUEST_TOPICS_CONFIG.map(t => (
                                 <NumberInput 
                                    key={t.key} label={t.label} name={`top_${t.key}`} 
                                    value={(formData.citizen_requests.requests as any)[t.key]}
                                    onChange={(_, v) => {markStepAsInteracted(); setFormData(p => ({...p, citizen_requests: {...p.citizen_requests, requests: {...p.citizen_requests.requests, [t.key]: v}}}))}}
                                    onBlur={() => handleFieldBlur(`citizen_requests.requests.${t.key}`)}
                                    error={touched[`citizen_requests.requests.${t.key}`] ? errors[`citizen_requests.requests.${t.key}`] : undefined}
                                />
                             ))}
                         </div>
                    </div>
                </div>
            );
            case 4: return (
                <div>
                    {formData.citizen_requests.examples.length === 0 && (
                        <div className="text-center py-8 px-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 mb-4">
                            <p>Для добавления примера обращения нажмите кнопку ниже</p>
                        </div>
                    )}
                    {formData.citizen_requests.examples.map((item, idx) => (
                        <GenericItemCard key={idx} title="Пример" index={idx} onRemove={() => removeItem('citizen_requests.examples', idx)}>
                             <TextInput 
                                type="textarea" 
                                label="Описание" 
                                name={`ex_${idx}`} 
                                value={item.text} 
                                onChange={(_, v) => updateList('citizen_requests.examples', idx, 'text', v)} 
                                error={touched[`citizen_requests.examples.${idx}.text`] ? errors[`citizen_requests.examples.${idx}.text`] : undefined}
                                required 
                             />
                             <LinkInputList 
                                links={item.links}
                                onChange={(newLinks) => updateList('citizen_requests.examples', idx, 'links', newLinks)}
                             />
                        </GenericItemCard>
                    ))}
                    <AddItemButton onClick={() => addItem('citizen_requests.examples', { text: '', links: [''] })}>Добавить пример</AddItemButton>
                </div>
            );
            case 5: return (
                 <div>
                    {formData.svo_support.projects.length === 0 && (
                        <div className="text-center py-8 px-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 mb-4">
                            <p>Для добавления проекта поддержки СВО нажмите кнопку ниже</p>
                        </div>
                    )}
                    {formData.svo_support.projects.map((item, idx) => (
                        <GenericItemCard key={idx} title="Проект СВО" index={idx} onRemove={() => removeItem('svo_support.projects', idx)}>
                             <TextInput 
                                type="textarea" 
                                label="Описание" 
                                name={`svo_${idx}`} 
                                value={item.text} 
                                onChange={(_, v) => updateList('svo_support.projects', idx, 'text', v)} 
                                error={touched[`svo_support.projects.${idx}.text`] ? errors[`svo_support.projects.${idx}.text`] : undefined}
                                required 
                             />
                             <LinkInputList 
                                links={item.links}
                                onChange={(newLinks) => updateList('svo_support.projects', idx, 'links', newLinks)}
                             />
                        </GenericItemCard>
                    ))}
                    <AddItemButton onClick={() => addItem('svo_support.projects', { text: '', links: [''] })}>Добавить проект</AddItemButton>
                </div>
            );
            case 6: return (
                <div>
                     {formData.project_activity.length === 0 && (
                        <div className="text-center py-8 px-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 mb-4">
                            <p>Для добавления проекта нажмите кнопку ниже</p>
                        </div>
                    )}
                     {formData.project_activity.map((item, idx) => (
                        <GenericItemCard key={idx} title="Проект" index={idx} onRemove={() => removeItem('project_activity', idx)}>
                            <TextInput 
                                type="textarea" label="Наименование" name={`pn_${idx}`} value={item.name} 
                                onChange={(_, v) => updateList('project_activity', idx, 'name', v)}
                                error={touched[`project_activity.${idx}.name`] ? errors[`project_activity.${idx}.name`] : undefined}
                                required
                            />
                            <TextInput 
                                type="textarea" label="Результат" name={`pr_${idx}`} value={item.result} 
                                onChange={(_, v) => updateList('project_activity', idx, 'result', v)}
                                error={touched[`project_activity.${idx}.result`] ? errors[`project_activity.${idx}.result`] : undefined}
                                required
                            />
                        </GenericItemCard>
                     ))}
                     <AddItemButton onClick={() => addItem('project_activity', { name: '', result: '' })}>Добавить проект</AddItemButton>
                </div>
            );
            case 7: return (
                <div>
                     {formData.ldpr_orders.length === 0 && (
                        <div className="text-center py-8 px-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 mb-4">
                            <p>Для добавления поручения нажмите кнопку ниже</p>
                        </div>
                    )}
                     {formData.ldpr_orders.map((item, idx) => (
                        <GenericItemCard key={idx} title="Поручение" index={idx} onRemove={() => removeItem('ldpr_orders', idx)}>
                            <TextInput 
                                type="textarea" label="Поручение" name={`oi_${idx}`} value={item.instruction} 
                                onChange={(_, v) => updateList('ldpr_orders', idx, 'instruction', v)}
                                error={touched[`ldpr_orders.${idx}.instruction`] ? errors[`ldpr_orders.${idx}.instruction`] : undefined}
                                required
                            />
                            <TextInput 
                                type="textarea" label="Работа" name={`oa_${idx}`} value={item.action} 
                                onChange={(_, v) => updateList('ldpr_orders', idx, 'action', v)}
                                error={touched[`ldpr_orders.${idx}.action`] ? errors[`ldpr_orders.${idx}.action`] : undefined}
                                required
                            />
                        </GenericItemCard>
                     ))}
                     <AddItemButton onClick={() => addItem('ldpr_orders', { instruction: '', action: '' })}>Добавить поручение</AddItemButton>
                </div>
            );
            case 8: return (
                <div>
                    <TextInput 
                        type="textarea" 
                        label="Иная значимая информация" 
                        name="other_info" 
                        value={formData.other_info} 
                        onChange={(_, v) => {markStepAsInteracted(); setFormData(p => ({...p, other_info: v}))}} 
                        placeholder="Заполнять не обязательно"
                    />
                </div>
            );
            default: return null;
        }
    };

    // ... rest of the component
    if (isSubmitted) {
        return (
            <SuccessPage
                onEdit={handleEditForm}
                pdfUrl={pdfUrl}
                onDownloadPdf={handleDownloadPdf}
            />
        );
    }
    const progressPercentage = (currentStep / (SECTIONS.length - 1)) * 100;

    return (
        <div ref={appContainerRef} className="overflow-hidden bg-white lg:bg-gray-50 flex flex-col font-sans">
             {notification && (
                <div className={`fixed top-5 left-1/2 -translate-x-1/2 w-11/12 max-w-md sm:w-auto sm:left-auto sm:right-5 sm:-translate-x-0 z-50 p-4 rounded-lg shadow-xl flex items-start text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} role="alert">
                    {notification.type === 'error' ? <AlertTriangle className="h-6 w-6 mr-3 shrink-0 mt-0.5" /> : <Check className="h-6 w-6 mr-3 shrink-0" />}
                    <div className="font-semibold flex-grow">{notification.message}</div>
                    <button onClick={() => setNotification(null)} className="ml-4 p-1 rounded-full hover:bg-black/20"><X className="h-5 w-5" /></button>
                </div>
            )}
            
            <div className="w-full max-w-7xl mx-auto flex-grow flex flex-col lg:flex-row lg:gap-6 lg:p-6 lg:h-full">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-[380px] bg-slate-800 rounded-2xl text-white flex-col shrink-0 shadow-2xl overflow-hidden">
                    <div className="mb-10 px-8 pt-8">
                        <h1 className="text-3xl font-bold tracking-tight">Отчет депутата ЛДПР</h1>
                        <p className="text-slate-400 mt-2">Пройдите все шаги для завершения</p>
                    </div>
                    <nav className="flex-grow overflow-y-auto pl-8 pr-4 pb-8 sidebar-scrollbar h-0" style={{ scrollbarGutter: 'stable' }}>
                        <ul className="space-y-2">
                            {SECTIONS.map((section, index) => {
                                const isValid = isStepValid(index, formData);
                                const isActive = index === currentStep;
                                const hasInteracted = interactedSteps[index];
                                const isEmpty = isStepEmpty(index, formData);
                                
                                // Logic for Visual State
                                // Active: Blue
                                // Error: Red (Invalid AND (Interacted OR Attempted))
                                // Success: Green (Valid AND Not Empty)
                                // Default: Gray (Empty Optional OR Untouched Mandatory)

                                const isError = !isValid && (hasInteracted || isFormAttempted);
                                const isSuccess = isValid && !isEmpty;

                                let statusClass = 'bg-slate-700 border-slate-600 text-slate-400';
                                
                                if (isActive) {
                                    statusClass = 'bg-blue-600 border-blue-500 text-white';
                                } else if (isError) {
                                    statusClass = 'bg-red-500 border-red-400 text-white';
                                } else if (isSuccess) {
                                    statusClass = 'bg-green-500 border-green-400 text-white';
                                }
                                // Else remains Gray

                                const StepIcon = STEP_ICONS[index];
                                return (
                                    <li key={section.title} ref={el => { desktopStepRefs.current[index] = el; }}>
                                        <button
                                            onClick={() => handleStepClick(index)}
                                            className={`w-full text-left p-3 rounded-lg transition-colors duration-200 flex items-center gap-4 ${isActive ? 'bg-blue-600/20' : 'hover:bg-slate-700'}`}
                                        >
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border-2 transition-all duration-300 ${statusClass}`}>
                                                {/* Icon Logic: Show Check if Success, Alert if Error, else generic Icon */}
                                                {!isActive && isSuccess ? <Check className="h-5 w-5" /> : 
                                                 !isActive && isError ? <AlertTriangle className="h-5 w-5" /> : 
                                                 <StepIcon className="h-5 w-5" />}
                                            </div>
                                            <div className="flex-grow">
                                                <p className={`text-sm ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>Шаг {index + 1}</p>
                                                <p className={`font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>{section.title}</p>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                    <div className="px-8 py-4 mt-auto border-t border-slate-700">
                        <button onClick={() => setIsClearConfirmOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-300 rounded-lg hover:bg-red-500/20 hover:text-red-200 transition-colors">
                            <Trash2 className="h-4 w-4" /> Очистить форму
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col lg:bg-white lg:rounded-2xl lg:shadow-2xl lg:overflow-hidden">
                    <div ref={contentRef} className="mobile-scrollbar-hide flex-grow overflow-y-auto px-4 sm:px-8 lg:p-8 lg:pr-6 h-0" style={{ scrollbarGutter: 'stable' }}>
                         {currentStep === 0 && (
                            <div className="lg:hidden pt-6 pb-6 flex justify-between items-center">
                                <h1 className="text-2xl font-bold text-slate-800">Отчет депутата ЛДПР</h1>
                                <button onClick={() => setIsClearConfirmOpen(true)} className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-red-600 hover:text-white transition-colors">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        <div className={`mb-8 lg:mt-0 ${currentStep === 0 ? 'mt-0 lg:mt-6' : 'pt-6 lg:pt-0'}`}>
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">{SECTIONS[currentStep].title}</h2>
                            <p className="text-slate-500 mt-2">Раздел {currentStep + 1} из {SECTIONS.length}</p>
                        </div>
                        
                        {/* Mobile Stepper */}
                        <div className="lg:hidden mb-8">
                            <div ref={mobileStepperRef} className="overflow-x-auto mobile-scrollbar-hide pb-3 -mx-4 sm:-mx-8">
                                <div className="flex items-center w-max px-4 sm:px-8">
                                    {SECTIONS.map((_, index) => {
                                        const isValid = isStepValid(index, formData);
                                        const isActive = index === currentStep;
                                        const hasInteracted = interactedSteps[index];
                                        const isEmpty = isStepEmpty(index, formData);

                                        const isError = !isValid && (hasInteracted || isFormAttempted);
                                        const isSuccess = isValid && !isEmpty;
                                        
                                        let statusClass = 'bg-slate-100 text-slate-400 border-transparent';
                                        
                                        if (isActive) {
                                            statusClass = 'bg-blue-600 text-white border-transparent shadow-lg';
                                        } else if (isError) {
                                            statusClass = 'bg-red-500 text-white border-transparent';
                                        } else if (isSuccess) {
                                            statusClass = 'bg-green-500 text-white border-transparent';
                                        }

                                        const StepIcon = STEP_ICONS[index];
                                        return (
                                            <React.Fragment key={index}>
                                                <button
                                                    ref={el => { stepRefs.current[index] = el; }}
                                                    onClick={() => handleStepClick(index)}
                                                    className={`flex flex-col items-center shrink-0`}
                                                >
                                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${statusClass}`}>
                                                        <StepIcon className="h-6 w-6" />
                                                    </div>
                                                </button>
                                                {index < SECTIONS.length - 1 && (
                                                    <div className={`h-1.5 rounded-full w-8 mx-2 transition-colors duration-300 ${isSuccess ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                             <div className="mt-4">
                                <div className="bg-slate-200 rounded-full h-2 w-full">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progressPercentage}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={(e) => e.preventDefault()} noValidate className="pb-24 lg:pb-0">
                            {renderCurrentStep()}
                        </form>
                    </div>
                    
                    {/* Desktop Footer */}
                    <div className="hidden lg:flex mt-auto pt-6 border-t border-slate-200 justify-between items-center shrink-0 px-4 sm:px-8 pb-4 sm:pb-8">
                        <div>
                             {currentStep > 0 && (
                                <button type="button" onClick={handleBack} className="px-6 py-3 text-base font-semibold rounded-lg flex items-center gap-2 transition-all shadow-sm bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
                                    <ArrowLeft className="h-5 w-5" /> Назад
                                </button>
                            )}
                        </div>
                        <div>
                             {currentStep < SECTIONS.length - 1 ? (
                                <button type="button" onClick={handleNext} className="px-6 py-3 text-base font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
                                    Вперед <ArrowRight className="h-5 w-5" />
                                </button>
                            ) : (
                                <button type="button" onClick={handleSubmit} className="px-6 py-3 text-base font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md bg-green-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 hover:bg-green-700">
                                    Сформировать отчет <Check className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>
            
            {/* Mobile Footer */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex gap-4 justify-between items-center shadow-top z-10">
                {currentStep > 0 ? (
                    <button type="button" onClick={handleBack} className="px-4 py-3 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
                        <ArrowLeft className="h-5 w-5" /> <span>Назад</span>
                    </button>
                ) : <div className="flex-1"></div>}
                {currentStep < SECTIONS.length - 1 ? (
                    <button type="button" onClick={handleNext} className="px-4 py-3 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 flex-1">
                        <span>Вперед</span> <ArrowRight className="h-5 w-5" />
                    </button>
                ) : (
                    <button type="button" onClick={handleSubmit} className="px-4 py-3 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md bg-green-600 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 flex-1 hover:bg-green-700">
                        <span>Сформировать</span> <Check className="h-5 w-5" />
                    </button>
                )}
            </div>

            {isMobile ? (
                <BottomSheet isOpen={isClearConfirmOpen} onClose={() => setIsClearConfirmOpen(false)} onConfirm={handleClearForm} title="Очистить форму?">
                    <p>Вы уверены, что хотите полностью очистить анкету? Все введенные данные будут безвозвратно удалены.</p>
                </BottomSheet>
            ) : (
                <ConfirmationModal isOpen={isClearConfirmOpen} onClose={() => setIsClearConfirmOpen(false)} onConfirm={handleClearForm} title="Очистить форму?">
                    <p>Вы уверены, что хотите полностью очистить анкету? Все введенные данные будут безвозвратно удалены.</p>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default RegistrationPage;
