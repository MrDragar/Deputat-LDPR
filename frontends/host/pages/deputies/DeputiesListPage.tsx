import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types';
import { Search, MoreVertical, Inbox, ChevronRight, Eye, User as UserIcon, Plus, UserCheck, UserX, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import TextInput from '../../components/ui/TextInput';
import CheckboxDropdown from '../../components/ui/CheckboxDropdown';
import DeputiesListSkeleton from '../../components/skeletons/DeputiesListSkeleton';
import BottomSheet from '../../components/ui/BottomSheet';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import AvailabilityModal from './AvailabilityModal';

const ALL_REGIONS: string[] = [
    'Алтайский край', 'Амурская область', 'Архангельская область', 'Астраханская область', 'Белгородская область', 'Брянская область',
    'Владимирская область', 'Волгоградская область', 'Вологодская область', 'Воронежская область', 'Донецкая Народная Республика',
    'Еврейская автономная область', 'Забайкальский край', 'Запорожская область', 'Ивановская область', 'Иркутская область',
    'Кабардино-Балкарская Республика', 'Калининградская область', 'Калужская область', 'Камчатский край', 'Карачаево-Черкесская Республика',
    'Кемеровская область – Кузбасс', 'Кировская область', 'Костромская область', 'Краснодарский край', 'Красноярский край', 'Курганская область',
    'Курская область', 'Ленинградская область', 'Липецкая область', 'Луганская Народная Республика', 'Магаданская область', 'Москва',
    'Московская область', 'Мурманская область', 'Ненецкий автономный округ', 'Нижегородская область', 'Новгородская область',
    'Новосибирская область', 'Омская область', 'Оренбургская область', 'Орловская область', 'Пензенская область', 'Пермский край',
    'Приморский край', 'Псковская область', 'Республика Адыгея', 'Республика Алтай', 'Республика Башкортостан', 'Республика Бурятия',
    'Республика Дагестан', 'Республика Ингушетия', 'Республика Калмыкия', 'Республика Карелия', 'Республика Коми', 'Республика Крым',
    'Республика Марий Эл', 'Республика Мордовия', 'Республика Саха (Якутия)', 'Республика Северная Осетия – Алания', 'Республика Татарстан',
    'Республика Тыва', 'Республика Хакасия', 'Ростовская область', 'Рязанская область', 'Самарская область', 'Санкт-Петербург',
    'Саратовская область', 'Сахалинская область', 'Свердловская область', 'Севастополь', 'Смоленская область', 'Ставропольский край',
    'Тамбовская область', 'Тверская область', 'Томская область', 'Тульская область', 'Тюменская область', 'Удмуртская Республика',
    'Ульяновская область', 'Хабаровский край', 'Ханты-мансийский автономный округ-Югра', 'Херсонская область', 'Челябинская область',
    'Чеченская Республика', 'Чувашская Республика', 'Чукотский автономный округ', 'Ямало-Ненецкий автономный округ', 'Ярославская область'
];

const REPRESENTATION_LEVELS = [
    { value: 'СФ', label: 'Совет Федерации Федерального собрания Российской Федерации' },
    { value: 'ГД', label: 'Государственная дума Федерального собрания Российской Федерации' },
    { value: 'ЗС', label: 'ЗС' },
    { value: 'АЦС', label: 'АЦС' },
    { value: 'МСУ', label: 'МСУ' }
];

const levelDisplayMap = REPRESENTATION_LEVELS.reduce((acc, level) => {
    acc[level.label] = level.value;
    return acc;
}, {} as Record<string, string>);

// Desktop Dropdown Component
const DesktopActionMenu: React.FC<{ 
    deputyId: number; 
    isOpen: boolean; 
    onToggle: (id: number) => void; 
    onClose: () => void;
    isAdmin: boolean;
    onEditAvailability: (id: number) => void;
}> = ({ deputyId, isOpen, onToggle, onClose, isAdmin, onEditAvailability }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    
    // Важно: проверяем isOpen внутри обработчика, чтобы не закрывать чужие меню
    const handleOutsideClick = useCallback(() => {
        if (isOpen) {
            onClose();
        }
    }, [isOpen, onClose]);

    useOutsideClick(menuRef, handleOutsideClick);

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(deputyId);
                }}
                className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
                <MoreVertical size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-[100] animate-in fade-in zoom-in-95 duration-100 origin-top-right ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        <Link
                            to={`/deputies/${deputyId}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                        >
                            <Eye size={18} />
                            Посмотреть анкету
                        </Link>
                        {isAdmin && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                    onEditAvailability(deputyId);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                            >
                                <RefreshCw size={18} />
                                Изменить взаимодействие
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const DeputiesListPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [coordinatorRegion, setCoordinatorRegion] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegions, setSelectedRegions] = useState<string[]>(
        currentUser?.role === 'admin' ? [...ALL_REGIONS] : []
    );
    const [selectedLevels, setSelectedLevels] = useState<string[]>(
      REPRESENTATION_LEVELS.map(level => level.label)
    );
    const [selectedInteraction, setSelectedInteraction] = useState<string[]>(['Взаимодействующий', 'Невзаимодействующий']);
    const [selectedVerification, setSelectedVerification] = useState<string[]>(['Верифицирован', 'Не верифицирован']);

    // Actions
    const [selectedDeputyForActions, setSelectedDeputyForActions] = useState<User | null>(null);
    const [desktopMenuOpenId, setDesktopMenuOpenId] = useState<number | null>(null);
    const [availabilityModalDeputy, setAvailabilityModalDeputy] = useState<User | null>(null);

    // Pagination / Infinite Scroll State
    const [displayCount, setDisplayCount] = useState(30);
    const [isFabVisible, setIsFabVisible] = useState(true);
    
    // Observer ref
    const observer = useRef<IntersectionObserver | null>(null);
    
    // Callback ref for the sentinel element
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
               setDisplayCount(prev => prev + 30);
            }
        }, { threshold: 0.5 });
        
        if (node) observer.current.observe(node);
    }, [loading]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersData = await api.getUsers();
                setAllUsers(usersData);
                
                if (currentUser?.role === 'coordinator') {
                    const coordinatorData = await api.getUserById(currentUser.user_id);
                    if (coordinatorData.deputyForm?.region) {
                        setCoordinatorRegion(coordinatorData.deputyForm.region);
                    }
                }
            } catch (err) {
                setError('Не удалось загрузить список депутатов.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);
    
    useEffect(() => {
        const mainContentArea = document.querySelector('main');
        if (!mainContentArea) return;

        const handleScroll = () => {
            if (mainContentArea.scrollTop > 50) {
                setIsFabVisible(false);
            } else {
                setIsFabVisible(true);
            }
        };

        mainContentArea.addEventListener('scroll', handleScroll, { passive: true });
        return () => mainContentArea.removeEventListener('scroll', handleScroll);
    }, []);

    const deputies = useMemo(() => {
       return allUsers
        .filter(u => ['deputy', 'coordinator'].includes(u.role) && u.deputyForm)
        .sort((a, b) => new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime());
    }, [allUsers]);
    
    const regionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        ALL_REGIONS.forEach(region => { counts[region] = 0; });

        const preFiltered = deputies.filter(d => {
            const form = d.deputyForm;
            if (!form) return false;
            const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.toLowerCase();
            
            const isInteracting = d.isAvailable !== false;
            const matchesInteraction = (isInteracting && selectedInteraction.includes('Взаимодействующий')) ||
                                       (!isInteracting && selectedInteraction.includes('Невзаимодействующий'));
                                       
            const isVerified = d.userId > 0;
            const matchesVerification = (isVerified && selectedVerification.includes('Верифицирован')) ||
                                        (!isVerified && selectedVerification.includes('Не верифицирован'));

            return (searchTerm === '' || fullName.includes(searchTerm.toLowerCase())) && 
                   selectedLevels.includes(form.representativeBodyLevel) &&
                   matchesInteraction && matchesVerification;
        });

        preFiltered.forEach(d => {
            const region = d.deputyForm?.region;
            if (region && counts.hasOwnProperty(region)) counts[region]++;
        });
        return counts;
    }, [deputies, searchTerm, selectedLevels, selectedInteraction, selectedVerification]);

    const levelCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        REPRESENTATION_LEVELS.forEach(level => { counts[level.label] = 0; });

        const preFiltered = deputies.filter(d => {
            const form = d.deputyForm;
            if (!form) return false;
            const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.toLowerCase();
            
            const isInteracting = d.isAvailable !== false;
            const matchesInteraction = (isInteracting && selectedInteraction.includes('Взаимодействующий')) ||
                                       (!isInteracting && selectedInteraction.includes('Невзаимодействующий'));
                                       
            const isVerified = d.userId > 0;
            const matchesVerification = (isVerified && selectedVerification.includes('Верифицирован')) ||
                                        (!isVerified && selectedVerification.includes('Не верифицирован'));

            const matchesRegion = currentUser?.role === 'admin' ? selectedRegions.includes(form.region) : true;

            return (searchTerm === '' || fullName.includes(searchTerm.toLowerCase())) && 
                   matchesRegion && matchesInteraction && matchesVerification;
        });

        preFiltered.forEach(d => {
            const level = d.deputyForm?.representativeBodyLevel;
            if (level && counts.hasOwnProperty(level)) counts[level]++;
        });
        return counts;
    }, [deputies, searchTerm, selectedRegions, selectedInteraction, selectedVerification, currentUser]);

    const interactionCounts = useMemo(() => {
        const counts: Record<string, number> = { 'Взаимодействующий': 0, 'Невзаимодействующий': 0 };

        const preFiltered = deputies.filter(d => {
            const form = d.deputyForm;
            if (!form) return false;
            const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.toLowerCase();
            
            const isVerified = d.userId > 0;
            const matchesVerification = (isVerified && selectedVerification.includes('Верифицирован')) ||
                                        (!isVerified && selectedVerification.includes('Не верифицирован'));

            const matchesRegion = currentUser?.role === 'admin' ? selectedRegions.includes(form.region) : true;
            const matchesLevel = selectedLevels.includes(form.representativeBodyLevel);

            return (searchTerm === '' || fullName.includes(searchTerm.toLowerCase())) && 
                   matchesRegion && matchesLevel && matchesVerification;
        });

        preFiltered.forEach(d => {
            const isInteracting = d.isAvailable !== false;
            if (isInteracting) counts['Взаимодействующий']++;
            else counts['Невзаимодействующий']++;
        });
        return counts;
    }, [deputies, searchTerm, selectedRegions, selectedLevels, selectedVerification, currentUser]);

    const verificationCounts = useMemo(() => {
        const counts: Record<string, number> = { 'Верифицирован': 0, 'Не верифицирован': 0 };

        const preFiltered = deputies.filter(d => {
            const form = d.deputyForm;
            if (!form) return false;
            const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.toLowerCase();
            
            const isInteracting = d.isAvailable !== false;
            const matchesInteraction = (isInteracting && selectedInteraction.includes('Взаимодействующий')) ||
                                       (!isInteracting && selectedInteraction.includes('Невзаимодействующий'));

            const matchesRegion = currentUser?.role === 'admin' ? selectedRegions.includes(form.region) : true;
            const matchesLevel = selectedLevels.includes(form.representativeBodyLevel);

            return (searchTerm === '' || fullName.includes(searchTerm.toLowerCase())) && 
                   matchesRegion && matchesLevel && matchesInteraction;
        });

        preFiltered.forEach(d => {
            const isVerified = d.userId > 0;
            if (isVerified) counts['Верифицирован']++;
            else counts['Не верифицирован']++;
        });
        return counts;
    }, [deputies, searchTerm, selectedRegions, selectedLevels, selectedInteraction, currentUser]);

    const filteredDeputies = useMemo(() => {
        let processed = [...deputies];
        if (currentUser?.role === 'coordinator' && coordinatorRegion) {
            processed = processed.filter(d => d.deputyForm?.region === coordinatorRegion);
        }

        return processed.filter(d => {
            const form = d.deputyForm;
            if (!form) return false;
            const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.toLowerCase();
            const matchesSearch = searchTerm === '' || fullName.includes(searchTerm.toLowerCase());
            const matchesRegion = currentUser?.role === 'admin' ? selectedRegions.includes(form.region) : true;
            const matchesLevel = selectedLevels.includes(form.representativeBodyLevel);
            
            const isInteracting = d.isAvailable !== false;
            const matchesInteraction = (isInteracting && selectedInteraction.includes('Взаимодействующий')) ||
                                       (!isInteracting && selectedInteraction.includes('Невзаимодействующий'));
                                       
            const isVerified = d.userId > 0;
            const matchesVerification = (isVerified && selectedVerification.includes('Верифицирован')) ||
                                        (!isVerified && selectedVerification.includes('Не верифицирован'));

            return matchesSearch && matchesRegion && matchesLevel && matchesInteraction && matchesVerification;
        });
    }, [deputies, currentUser, coordinatorRegion, searchTerm, selectedRegions, selectedLevels, selectedInteraction, selectedVerification]);

    // Reset pagination when filters change
    useEffect(() => {
        setDisplayCount(30);
        // Scroll to top if filters change (optional, but good UX)
        // window.scrollTo(0, 0); 
    }, [filteredDeputies]);

    const visibleDeputies = useMemo(() => {
        return filteredDeputies.slice(0, displayCount);
    }, [filteredDeputies, displayCount]);

    const handleAvailabilityChange = async (isAvailable: boolean, reason: string | null) => {
        if (!availabilityModalDeputy) return;
        try {
            await api.updateAvailability(availabilityModalDeputy.userId, isAvailable, reason);
            setAllUsers(prev => prev.map(u => 
                u.userId === availabilityModalDeputy.userId 
                    ? { ...u, isAvailable, reasonUnavailable: reason } 
                    : u
            ));
            setAvailabilityModalDeputy(null);
        } catch (err) {
            console.error('Failed to update availability', err);
            // Optionally show an error message
        }
    };

    if (loading) return <DeputiesListSkeleton />;
    if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

    return (
        <div className="space-y-6">
            {/* Unified Header & Filters Section */}
            <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">Наши депутаты</h1>
                        <span className="bg-blue-600 text-white font-semibold px-3 py-1 text-sm rounded-full">
                            {filteredDeputies.length}
                        </span>
                    </div>
                    {currentUser?.role === 'admin' && (
                        <Link
                            to="/add_deputy"
                            className="hidden sm:inline-flex items-center justify-center bg-blue-600 text-white font-semibold rounded-full w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 sm:rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            <span className="hidden sm:inline sm:ml-2">Добавить депутата</span>
                        </Link>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                             <TextInput
                                name="search" type="text" placeholder="Поиск по ФИО..." value={searchTerm}
                                onChange={(_, val) => setSearchTerm(val)}
                                icon={<Search className="h-5 w-5 text-gray-400" />}
                                className="h-[50px]"
                            />
                        </div>
                         {currentUser?.role === 'admin' && (
                            <CheckboxDropdown
                                title=""
                                options={ALL_REGIONS}
                                selectedOptions={selectedRegions}
                                onChange={setSelectedRegions}
                                counts={regionCounts}
                            />
                        )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6 md:gap-6 lg:gap-10 items-stretch">
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Уровень представительства</p>
                            <div className="flex flex-wrap items-center gap-2">
                               {REPRESENTATION_LEVELS.map(level => {
                                   const isSelected = selectedLevels.includes(level.label);
                                   const count = levelCounts[level.label] || 0;
                                    return (
                                        <button
                                            key={level.value}
                                            title={`${level.label} (${count})`}
                                            onClick={() => {
                                                const newSelection = isSelected
                                                    ? selectedLevels.filter(l => l !== level.label)
                                                    : [...selectedLevels, level.label];
                                                setSelectedLevels(newSelection);
                                            }}
                                            className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${
                                                isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {level.value}
                                        </button>
                                    )
                               })}
                            </div>
                        </div>

                        <div className="hidden md:block w-px bg-gray-200 my-2"></div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Уровень взаимодействия</p>
                            <div className="flex flex-wrap items-center gap-2">
                                {[
                                    { label: 'Взаимодействующий', icon: <UserCheck size={20} /> },
                                    { label: 'Невзаимодействующий', icon: <UserX size={20} /> }
                                ].map(option => {
                                    const isSelected = selectedInteraction.includes(option.label);
                                    const count = interactionCounts[option.label] || 0;
                                    return (
                                        <button
                                            key={option.label}
                                            title={`${option.label} (${count})`}
                                            onClick={() => {
                                                const newSelection = isSelected
                                                    ? selectedInteraction.filter(l => l !== option.label)
                                                    : [...selectedInteraction, option.label];
                                                setSelectedInteraction(newSelection);
                                            }}
                                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                                                isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {option.icon}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="hidden md:block w-px bg-gray-200 my-2"></div>

                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Уровень верификации</p>
                            <div className="flex flex-wrap items-center gap-2">
                                {[
                                    { label: 'Верифицирован', icon: <ShieldCheck size={20} /> },
                                    { label: 'Не верифицирован', icon: <ShieldAlert size={20} /> }
                                ].map(option => {
                                    const isSelected = selectedVerification.includes(option.label);
                                    const count = verificationCounts[option.label] || 0;
                                    return (
                                        <button
                                            key={option.label}
                                            title={`${option.label} (${count})`}
                                            onClick={() => {
                                                const newSelection = isSelected
                                                    ? selectedVerification.filter(l => l !== option.label)
                                                    : [...selectedVerification, option.label];
                                                setSelectedVerification(newSelection);
                                            }}
                                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                                                isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {option.icon}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden lg:block">
                {visibleDeputies.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
                        <div className="overflow-visible">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 w-12 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center first:rounded-tl-xl">№</th>
                                        <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ФИО депутата</th>
                                        <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Регион</th>
                                        <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Роль в РО</th>
                                        <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Уровень</th>
                                        <th scope="col" className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Взаимодействие</th>
                                        <th scope="col" className="px-6 py-4 w-16 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider last:rounded-tr-xl">Действия</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {visibleDeputies.map((deputy, index) => {
                                        const form = deputy.deputyForm!;
                                        return (
                                            <tr key={deputy.userId} className="bg-white hover:bg-slate-50/50 transition-colors group">
                                                <td className={`px-6 py-5 font-bold text-center text-gray-400`}>{index + 1}</td>
                                                <th scope="row" className={`px-6 py-5 font-medium whitespace-nowrap text-gray-900`}>
                                                    <div className="flex items-center gap-2">
                                                        {`${form.lastName} ${form.firstName} ${form.middleName || ''}`}
                                                        {deputy.userId > 0 && (
                                                            <ShieldCheck size={18} className="text-blue-500 flex-shrink-0" title="Верифицирован" />
                                                        )}
                                                    </div>
                                                </th>
                                                <td className="px-6 py-5 text-gray-600 font-medium">{form.region}</td>
                                                <td className="px-6 py-5 text-gray-500 font-medium">{form.partyRole}</td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                                        {levelDisplayMap[form.representativeBodyLevel] || form.representativeBodyLevel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex justify-center">
                                                        {deputy.isAvailable !== false ? (
                                                            <div className="text-green-500" title="Взаимодействующий">
                                                                <UserCheck size={20} />
                                                            </div>
                                                        ) : (
                                                            <div className="text-red-500" title={`Невзаимодействующий: ${deputy.reasonUnavailable || 'Причина не указана'}`}>
                                                                <UserX size={20} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center overflow-visible relative">
                                                    <DesktopActionMenu 
                                                        deputyId={deputy.userId}
                                                        isOpen={desktopMenuOpenId === deputy.userId}
                                                        onToggle={(id) => setDesktopMenuOpenId(desktopMenuOpenId === id ? null : id)}
                                                        onClose={() => setDesktopMenuOpenId(null)}
                                                        isAdmin={currentUser?.role === 'admin'}
                                                        onEditAvailability={() => setAvailabilityModalDeputy(deputy)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <NoResults deputiesCount={deputies.length} />
                )}
            </div>

            {/* Mobile List View */}
            <div className="lg:hidden">
                {visibleDeputies.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {visibleDeputies.map((deputy, index) => {
                                const form = deputy.deputyForm!;
                                return (
                                    <li key={deputy.userId}>
                                        <button 
                                            onClick={() => setSelectedDeputyForActions(deputy)}
                                            className="w-full flex items-start gap-4 p-5 text-left active:bg-gray-50 transition-colors"
                                        >
                                            <div className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full font-bold text-sm bg-slate-100 text-slate-500`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-base font-medium truncate leading-tight text-gray-900`}>
                                                        {form.lastName} {form.firstName} {form.middleName}
                                                    </p>
                                                    {deputy.userId > 0 && (
                                                        <ShieldCheck size={16} className="text-blue-500 flex-shrink-0" title="Верифицирован" />
                                                    )}
                                                </div>
                                                <div className="mt-2 space-y-1 text-sm">
                                                    <p className="text-gray-600 font-medium">
                                                        <span className="text-gray-400 font-normal">Регион:</span> {form.region}
                                                    </p>
                                                    <p className="text-gray-500 line-clamp-1">
                                                        <span className="text-gray-400 font-normal">Роль:</span> {form.partyRole}
                                                    </p>
                                                    <div className="pt-1 flex items-center gap-2">
                                                        <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                                            {levelDisplayMap[form.representativeBodyLevel] || form.representativeBodyLevel}
                                                        </span>
                                                        {deputy.isAvailable !== false ? (
                                                            <div className="text-green-500" title="Взаимодействующий">
                                                                <UserCheck size={16} />
                                                            </div>
                                                        ) : (
                                                            <div className="text-red-500" title={`Невзаимодействующий: ${deputy.reasonUnavailable || 'Причина не указана'}`}>
                                                                <UserX size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-300 ml-2 flex-shrink-0 self-center" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ) : (
                    <NoResults deputiesCount={deputies.length} />
                )}
            </div>
            
            {/* Infinite Scroll Sentinel */}
            {visibleDeputies.length < filteredDeputies.length && (
                <div ref={lastElementRef} className="h-10 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Mobile Actions Bottom Sheet */}
            <BottomSheet
                isOpen={!!selectedDeputyForActions}
                onClose={() => setSelectedDeputyForActions(null)}
                title="Выберите действие"
                hideIcon={true}
                hideActions={true}
            >
                <div className="border-b border-gray-200 mb-5 -mt-1 -mx-4 sm:-mx-6" />
                <div className="pb-4">
                    <p className="text-lg font-medium text-gray-900 text-center mb-6">
                        {selectedDeputyForActions?.deputyForm?.lastName} {selectedDeputyForActions?.deputyForm?.firstName} {selectedDeputyForActions?.deputyForm?.middleName}
                    </p>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => {
                                if (selectedDeputyForActions) {
                                    navigate(`/deputies/${selectedDeputyForActions.userId}`);
                                    setSelectedDeputyForActions(null);
                                }
                            }}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                        >
                            <Eye size={20} />
                            Посмотреть анкету
                        </button>
                        
                        {currentUser?.role === 'admin' && (
                            <button
                                onClick={() => {
                                    setAvailabilityModalDeputy(selectedDeputyForActions);
                                    setSelectedDeputyForActions(null);
                                }}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors shadow-sm"
                            >
                                <RefreshCw size={20} className="text-gray-500" />
                                Изменить взаимодействие
                            </button>
                        )}
                    </div>
                </div>
            </BottomSheet>

            {/* Availability Modal */}
            <AvailabilityModal
                isOpen={!!availabilityModalDeputy}
                onClose={() => setAvailabilityModalDeputy(null)}
                deputy={availabilityModalDeputy}
                onConfirm={handleAvailabilityChange}
            />

            {/* Mobile FAB */}
            {currentUser?.role === 'admin' && (
                <Link
                    to="/add_deputy"
                    className={`sm:hidden fixed bottom-6 right-6 z-30 flex items-center justify-center h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-300 ease-in-out hover:scale-105 ${isFabVisible ? 'translate-y-0' : 'translate-y-24'}`}
                    aria-label="Добавить депутата"
                >
                    <Plus className="h-7 w-7" />
                </Link>
            )}
        </div>
    );
};

const NoResults: React.FC<{ deputiesCount: number }> = ({ deputiesCount }) => (
    <div className="bg-white text-center p-16 rounded-2xl border border-gray-200 shadow-sm mx-4 sm:mx-0">
        <Inbox className="h-20 w-20 text-gray-200 mx-auto" />
        <h3 className="mt-6 text-xl font-bold text-gray-800">
           Депутаты не найдены
        </h3>
        <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
            {deputiesCount > 0 
                ? 'Попробуйте изменить параметры фильтрации или поисковый запрос.' 
                : 'В системе пока нет зарегистрированных депутатов, соответствующих вашему уровню доступа.'}
        </p>
    </div>
);

export default DeputiesListPage;