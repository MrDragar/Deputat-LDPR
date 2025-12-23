import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types';
import { Search, MoreVertical, Eye, Inbox } from 'lucide-react';
import TextInput from '../../components/ui/TextInput';
import CheckboxDropdown from '../../components/ui/CheckboxDropdown';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import ApplicationsListSkeleton from '../../components/skeletons/ApplicationsListSkeleton';

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

const ActionsDropdown: React.FC<{ user: User }> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number, left: number } | null>(null);
    const navigate = useNavigate();
    const portalRoot = document.body;

    useOutsideClick(dropdownRef, (event) => {
        if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
            return;
        }
        if (isOpen) setIsOpen(false);
    });

    const handleToggle = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownWidth = 224; // w-56
            const dropdownHeight = 88; // Estimated height
            const margin = 4;

            let left = rect.left + rect.width - dropdownWidth;
            if (left < 8) left = 8;

            let top = rect.bottom + window.scrollY + margin;
            if (top + dropdownHeight > window.innerHeight + window.scrollY) {
                top = rect.top + window.scrollY - dropdownHeight - margin;
            }

            setDropdownPosition({ top, left });
        }
        setIsOpen(!isOpen);
    };

    const viewProfile = () => {
        setIsOpen(false);
        navigate(`/deputies/${user.userId}`);
    };

    const dropdownContent = (
         <div 
            ref={dropdownRef}
            className="fixed w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-200"
            style={{ 
                top: dropdownPosition ? `${dropdownPosition.top}px` : undefined, 
                left: dropdownPosition ? `${dropdownPosition.left}px` : undefined,
            }}
        >
            <ul className="py-1">
                <li>
                    <button onClick={viewProfile} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Eye size={16} /> Посмотреть анкету
                    </button>
                </li>
                <li>
                    <button disabled className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                        В разработке
                    </button>
                </li>
            </ul>
        </div>
    );

    return (
        <div>
            <button ref={buttonRef} onClick={handleToggle} className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800">
                <MoreVertical size={20} />
            </button>
            {isOpen && dropdownPosition && createPortal(dropdownContent, portalRoot)}
        </div>
    );
};


const DeputiesListPage: React.FC = () => {
    const { user: currentUser } = useAuth();
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
    
    const deputies = useMemo(() => {
       return allUsers
        .filter(u => ['deputy', 'coordinator'].includes(u.role) && u.deputyForm)
        .sort((a, b) => new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime());
    }, [allUsers]);
    
    const regionCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        ALL_REGIONS.forEach(region => {
            counts[region] = 0;
        });

        const preFilteredDeputies = deputies.filter(d => {
            const form = d.deputyForm;
            if (!form) return false;

            const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.toLowerCase();
            const matchesSearch = searchTerm === '' || fullName.includes(searchTerm.toLowerCase());
            const matchesLevel = selectedLevels.includes(form.representativeBodyLevel);

            return matchesSearch && matchesLevel;
        });

        preFilteredDeputies.forEach(d => {
            const region = d.deputyForm?.region;
            if (region && counts.hasOwnProperty(region)) {
                counts[region]++;
            }
        });

        return counts;
    }, [deputies, searchTerm, selectedLevels]);

    const filteredDeputies = useMemo(() => {
        let processedDeputies = [...deputies];

        if (currentUser?.role === 'coordinator' && coordinatorRegion) {
            processedDeputies = processedDeputies.filter(d => d.deputyForm?.region === coordinatorRegion);
        }

        // Apply filters
        processedDeputies = processedDeputies.filter(d => {
            const form = d.deputyForm;
            if (!form) return false;

            const fullName = `${form.lastName} ${form.firstName} ${form.middleName || ''}`.toLowerCase();
            const matchesSearch = searchTerm === '' || fullName.includes(searchTerm.toLowerCase());
            
            const matchesRegion = currentUser?.role === 'admin' 
                ? selectedRegions.includes(form.region)
                : true;

            const matchesLevel = selectedLevels.includes(form.representativeBodyLevel);

            return matchesSearch && matchesRegion && matchesLevel;
        });

        return processedDeputies;
    }, [deputies, currentUser, coordinatorRegion, searchTerm, selectedRegions, selectedLevels]);


    if (loading) return <ApplicationsListSkeleton />;
    if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Наши депутаты</h1>
                <span className="bg-blue-600 text-white font-semibold px-3 py-1 text-sm rounded-full">
                    {filteredDeputies.length}
                </span>
            </div>

            {/* Filters Card */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput
                            name="search" type="text" placeholder="Поиск по ФИО..." value={searchTerm}
                            onChange={(_, val) => setSearchTerm(val)}
                            icon={<Search className="h-5 w-5 text-gray-400" />}
                        />
                         {currentUser?.role === 'admin' && (
                            <CheckboxDropdown
                                options={ALL_REGIONS}
                                selectedOptions={selectedRegions}
                                onChange={setSelectedRegions}
                                counts={regionCounts}
                            />
                        )}
                    </div>
                    <div>
                        <p className="text-base font-semibold text-gray-800 mb-2">Уровень представительства</p>
                        <div className="flex flex-wrap items-center gap-2">
                           {REPRESENTATION_LEVELS.map(level => {
                               const isSelected = selectedLevels.includes(level.label);
                                return (
                                    <button
                                        key={level.value}
                                        onClick={() => {
                                            const newSelection = isSelected
                                                ? selectedLevels.filter(l => l !== level.label)
                                                : [...selectedLevels, level.label];
                                            setSelectedLevels(newSelection);
                                        }}
                                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                                            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {level.value}
                                    </button>
                                )
                           })}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Table or No Results */}
            {filteredDeputies.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="text-sm text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 w-10 font-bold">№</th>
                                <th scope="col" className="px-6 py-4 font-bold">Полное имя</th>
                                <th scope="col" className="px-6 py-4 font-bold">Регион</th>
                                <th scope="col" className="px-6 py-4 font-bold">Роль в РО</th>
                                <th scope="col" className="px-6 py-4 font-bold">Уровень</th>
                                <th scope="col" className="px-6 py-4 text-center font-bold">ДЕЙСТВИЯ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDeputies.map((deputy, index) => {
                                const form = deputy.deputyForm!;
                                return (
                                    <tr key={deputy.userId} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {`${form.lastName} ${form.firstName} ${form.middleName || ''}`}
                                        </th>
                                        <td className="px-6 py-4 text-gray-600">{form.region}</td>
                                        <td className="px-6 py-4 text-gray-600">{form.partyRole}</td>
                                        <td className="px-6 py-4 text-gray-600">{levelDisplayMap[form.representativeBodyLevel] || form.representativeBodyLevel}</td>
                                        <td className="px-6 py-4 text-center">
                                            <ActionsDropdown user={deputy} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                 <div className="bg-white text-center p-12 rounded-xl border border-gray-200 shadow-sm">
                    <Inbox className="h-16 w-16 text-gray-300 mx-auto" />
                    <h3 className="mt-6 text-xl font-medium text-gray-800">
                       Депутаты не найдены
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {deputies.length > 0 ? 'Попробуйте изменить параметры фильтрации.' : 'В системе пока нет зарегистрированных депутатов.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DeputiesListPage;