import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, FilePlus2, FileCheck2, Clock, FileX2, Layers, CheckCircle2, Info, BarChart2 } from 'lucide-react';
import type { ProcessedLawData } from '../types';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { CheckboxDropdown } from './CheckboxDropdown';

interface LawmakingAnalyticsProps {
    allData: ProcessedLawData;
    onBack: () => void;
    onViewDetails: (region: string) => void;
}

const STATUS_MAP = [
    { key: 'Принят ЛДПР', color: '#48BB78', test: (s: string) => s.startsWith('принят по инициативе лдпр') },
    { key: 'Внесен ЛДПР', color: '#3E66F4', test: (s: string) => s.startsWith('внесен лдпр') },
    { key: 'На рассмотрении', color: '#F59E0B', test: (s: string) => s.startsWith('ожидает') },
    { key: 'Принят/Внесен другими', color: '#63B3ED', test: (s: string) => s.includes('по инициативе другой партии') },
    { key: 'Не внесен', color: '#A0AEC0', test: (s: string) => s.startsWith('не внесен') },
    { key: 'Нет данных', color: '#E2E8F0', test: (s: string) => !s || s === '-' }
];

const getStatusInfo = (status: string | null) => {
    if (!status || typeof status !== 'string') {
        return STATUS_MAP.find(c => c.key === 'Нет данных')!;
    }
    const s = status.toLowerCase().trim().replace(/\n/g, ' ');
    return STATUS_MAP.find(c => c.test(s)) || { key: 'Не внесен', color: '#A0AEC0' };
};

const LawSelector: React.FC<{
    laws: string[];
    selectedLaw: string;
    onSelect: (law: string) => void;
}> = ({ laws, selectedLaw, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useOutsideClick<HTMLDivElement>(() => setIsOpen(false));

    const filteredLaws = useMemo(() => laws.filter(law => law.toLowerCase().includes(search.toLowerCase())), [laws, search]);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="text-sm font-semibold mb-2 text-brand-on-surface-primary block">Выберите законопроект для анализа</label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-left flex justify-between items-center"
            >
                <span className="truncate pr-2">{selectedLaw}</span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-30 p-2">
                    <div className="relative mb-2">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Поиск закона..."
                            className="w-full bg-gray-50 text-brand-on-surface-primary placeholder:text-brand-on-surface-secondary pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                        {filteredLaws.map(law => (
                            <li
                                key={law}
                                onClick={() => { onSelect(law); setIsOpen(false); setSearch(''); }}
                                className={`p-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 ${selectedLaw === law ? 'font-bold text-brand-primary' : ''}`}
                            >
                                {law}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number;
    colorClass: string;
    tooltipContent?: React.ReactNode;
}> = ({ icon, label, value, colorClass, tooltipContent }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-[auto_1fr] gap-x-4 items-start"
            onMouseEnter={() => tooltipContent && setIsHovered(true)}
            onMouseLeave={() => tooltipContent && setIsHovered(false)}
        >
            {tooltipContent && <Info size={16} className="absolute top-4 right-4 text-gray-300" />}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                {icon}
            </div>
            <div className={`min-w-0 ${tooltipContent ? 'pr-6' : ''}`}>
                <p className="text-3xl font-bold text-brand-on-surface-primary">{value.toLocaleString('ru-RU')}</p>
                <p className="text-sm text-brand-on-surface-secondary mt-1">{label}</p>
            </div>

            {isHovered && tooltipContent && (
                 <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-max z-20"
                >
                    {tooltipContent}
                </div>
            )}
        </div>
    );
};


export const LawmakingAnalytics: React.FC<LawmakingAnalyticsProps> = ({ allData, onBack, onViewDetails }) => {
    const [selectedLaw, setSelectedLaw] = useState<string>(allData.lawList[0] || '');
    const [selectedRegions, setSelectedRegions] = useState<string[]>(allData.regionOptions);
    const [activeStatusFilter, setActiveStatusFilter] = useState<string>('Все');
    const [regionSearch, setRegionSearch] = useState('');

    const lawTotals = useMemo(() => {
        const data = Object.values(allData.dataByRegion);
        const totals = {
            model: {
                submitted_ldpr_only: 0,
                submitted_ldpr_cross_party: 0,
                adopted_ldpr_only: 0,
                adopted_ldpr_cross_party: 0,
                pending: 0,
                not_submitted_vнесен_other_party: 0,
                not_submitted_pринят_other_party: 0,
                not_submitted_irrelevant: 0,
                not_submitted_other_reason: 0
            },
            own: { contributed: 0, accepted: 0 },
        };

        if (!data.length) return { 
            model: { ...totals.model, submitted_ldpr: 0, adopted_ldpr: 0, submitted_and_adopted: 0, not_submitted_total: 0 }, 
            own: totals.own, 
            total: { submitted: 0, accepted: 0 } 
        };

        data.forEach(region => {
            totals.own.contributed += region.others.contributed || 0;
            totals.own.accepted += region.others.accepted || 0;
            Object.values(region.federal_laws).forEach(status => {
                if (typeof status !== 'string' || status === '-') return;
                const s = status.toLowerCase().trim().replace(/\n/g, ' ');
                
                if (s.startsWith('принят по инициативе лдпр')) {
                    if (s.includes('по инициативе только лдпр')) totals.model.adopted_ldpr_only++;
                    else if (s.includes('межфракционная инициатива')) totals.model.adopted_ldpr_cross_party++;
                    else totals.model.adopted_ldpr_only++; // Default if not specified
                } else if (s.startsWith('внесен лдпр')) {
                    if (s.includes('по инициативе только лдпр')) totals.model.submitted_ldpr_only++;
                    else if (s.includes('межфракционная инициатива')) totals.model.submitted_ldpr_cross_party++;
                    else totals.model.submitted_ldpr_only++; // Default if not specified
                } else if (s.startsWith('ожидает')) {
                    totals.model.pending++;
                } else if (s.startsWith('не внесен')) {
                    if (s.includes('внесен по инициативе другой партии')) totals.model.not_submitted_vнесен_other_party++;
                    else if (s.includes('принят по инициативе другой партии')) totals.model.not_submitted_pринят_other_party++;
                    else if (s.includes('неактуально')) totals.model.not_submitted_irrelevant++;
                    else totals.model.not_submitted_other_reason++;
                }
            });
        });

        const submitted_ldpr = totals.model.submitted_ldpr_only + totals.model.submitted_ldpr_cross_party;
        const adopted_ldpr = totals.model.adopted_ldpr_only + totals.model.adopted_ldpr_cross_party;
        const submitted_and_adopted = submitted_ldpr + adopted_ldpr;
        const not_submitted_total = totals.model.not_submitted_vнесен_other_party + totals.model.not_submitted_pринят_other_party + totals.model.not_submitted_irrelevant + totals.model.not_submitted_other_reason;
        
        return {
            model: { ...totals.model, submitted_ldpr, adopted_ldpr, submitted_and_adopted, not_submitted_total },
            own: totals.own,
            total: {
                submitted: submitted_and_adopted + totals.own.contributed + totals.own.accepted,
                accepted: adopted_ldpr + totals.own.accepted,
            },
        };
    }, [allData]);
    
    const submittedTooltip = (
        <div className="w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-2xl text-xs">
            <div className="text-center mb-2">
                <p className="text-2xl font-bold text-brand-on-surface-primary">{lawTotals.model.submitted_and_adopted}</p>
                <p className="font-semibold text-sm text-brand-on-surface-secondary">Всего модельных инициатив</p>
            </div>
            <hr className="mb-2 border-gray-100" />
            <ul className="space-y-1.5">
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span><span>На рассмотрении</span></div>
                    <span className="font-semibold text-gray-800">{lawTotals.model.submitted_ldpr}</span>
                </li>
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span><span>Уже принято</span></div>
                    <span className="font-semibold text-gray-800">{lawTotals.model.adopted_ldpr}</span>
                </li>
            </ul>
        </div>
    );

    const adoptedTooltip = (
        <div className="w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-2xl text-xs">
            <div className="text-center mb-2">
                <p className="text-2xl font-bold text-brand-on-surface-primary">{lawTotals.model.adopted_ldpr}</p>
                <p className="font-semibold text-sm text-brand-on-surface-secondary">Принято ЛДПР</p>
            </div>
            <hr className="mb-2 border-gray-100" />
            <ul className="space-y-1.5">
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span><span>По инициативе только ЛДПР</span></div>
                    <span className="font-semibold text-gray-800">{lawTotals.model.adopted_ldpr_only}</span>
                </li>
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 mr-2"></span><span>Межфракционная инициатива</span></div>
                    <span className="font-semibold text-gray-800">{lawTotals.model.adopted_ldpr_cross_party}</span>
                </li>
            </ul>
        </div>
    );

    const notSubmittedTooltip = (
        <div className="w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-2xl text-xs">
            <div className="text-center mb-2">
                 <p className="text-2xl font-bold text-brand-on-surface-primary">{lawTotals.model.not_submitted_total}</p>
                 <p className="font-semibold text-sm text-brand-on-surface-secondary">Причины не внесения</p>
            </div>
            <hr className="mb-2 border-gray-100" />
            <ul className="space-y-1.5">
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-slate-400 mr-2"></span><span>Неактуально для региона</span></div>
                    <span className="font-semibold text-gray-800">{lawTotals.model.not_submitted_irrelevant}</span>
                </li>
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 mr-2"></span><span>Внесен по инициативе другой партии</span></div>
                    <span className="font-semibold text-gray-800">{lawTotals.model.not_submitted_vнесен_other_party}</span>
                </li>
                 <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-sky-600 mr-2"></span><span>Принят по инициативе другой партии</span></div>
                    <span className="font-semibold text-gray-800">{lawTotals.model.not_submitted_pринят_other_party}</span>
                </li>
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-slate-600 mr-2"></span><span>Иная причина</span></div>
                    <span className="font-semibold text-gray-800">{lawTotals.model.not_submitted_other_reason}</span>
                </li>
            </ul>
        </div>
    );

    const statusFilterOptions = useMemo(() => ['Все', 'Принят ЛДПР', 'Внесен ЛДПР', 'На рассмотрении', 'Принят/Внесен другими', 'Не внесен'], []);

    const filteredData = useMemo(() => {
        return allData.regionOptions
            .map(regionName => allData.dataByRegion[regionName])
            .filter(Boolean)
            .filter(region => {
                const matchesSelectedRegions = selectedRegions.length === allData.regionOptions.length || selectedRegions.includes(region.region_name);
                const matchesSearch = region.region_name.toLowerCase().includes(regionSearch.toLowerCase());
                
                if (!matchesSelectedRegions || !matchesSearch) return false;

                const status = region.federal_laws[selectedLaw];
                if (activeStatusFilter === 'Все') return true;

                if (typeof status !== 'string' || status === '-') {
                   return activeStatusFilter === 'Не внесен'
                };
                
                const s = status.toLowerCase().trim();
                
                switch(activeStatusFilter) {
                    case 'Принят ЛДПР': return s.startsWith('принят по инициативе лдпр');
                    case 'Внесен ЛДПР': return s.startsWith('внесен лдпр');
                    case 'На рассмотрении': return s.startsWith('ожидает');
                    case 'Принят/Внесен другими': return s.includes('по инициативе другой партии');
                    case 'Не внесен': return s.startsWith('не внесен') && !s.includes('по инициативе другой партии');
                    default: return false;
                }
            });
    }, [allData, selectedLaw, selectedRegions, activeStatusFilter, regionSearch]);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = Object.fromEntries(statusFilterOptions.map(key => [key, 0]));

        const regionsToProcess = allData.regionOptions
            .filter(regionName => selectedRegions.length === allData.regionOptions.length || selectedRegions.includes(regionName));

        regionsToProcess.forEach(regionName => {
            const region = allData.dataByRegion[regionName];
            if (region) {
                const status = region.federal_laws[selectedLaw];
                
                counts['Все']++;
                if (typeof status !== 'string' || status === '-') {
                    counts['Не внесен']++;
                    return;
                }

                const s = status.toLowerCase().trim();

                if (s.startsWith('принят по инициативе лдпр')) counts['Принят ЛДПР']++;
                else if (s.startsWith('внесен лдпр')) counts['Внесен ЛДПР']++;
                else if (s.startsWith('ожидает')) counts['На рассмотрении']++;
                else if (s.includes('по инициативе другой партии')) counts['Принят/Внесен другими']++;
                else if (s.startsWith('не внесен')) counts['Не внесен']++;
            }
        });
        return counts;
    }, [allData, selectedLaw, selectedRegions, statusFilterOptions]);
    
    const otherInitiativesRegions = useMemo(() => {
        return filteredData
            .filter(r => r.others.contributed > 0 || r.others.accepted > 0)
            .sort((a, b) => (b.others.contributed + b.others.accepted) - (a.others.contributed + a.others.accepted));
    }, [filteredData]);


    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
            <header className="flex items-center gap-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-brand-on-surface-primary">Анализ законотворческой деятельности</h1>
                    <p className="text-brand-on-surface-secondary mt-1">Детальная статистика по инициативам в регионах</p>
                </div>
            </header>

            <section className="mt-8 space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-brand-on-surface-primary mb-4">Модельные законопроекты</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={<FilePlus2 size={24} className="text-white"/>} label="Внесено всего модельных законопроектов" value={lawTotals.model.submitted_and_adopted} colorClass="bg-brand-primary" tooltipContent={submittedTooltip} />
                        <StatCard icon={<FileCheck2 size={24} className="text-white"/>} label="Принято ЛДПР" value={lawTotals.model.adopted_ldpr} colorClass="bg-emerald-500" tooltipContent={adoptedTooltip} />
                        <StatCard icon={<Clock size={24} className="text-white"/>} label="Ожидает заключения" value={lawTotals.model.pending} colorClass="bg-amber-500" />
                        <StatCard icon={<FileX2 size={24} className="text-white"/>} label="Не внесено (всего)" value={lawTotals.model.not_submitted_total} colorClass="bg-red-500" tooltipContent={notSubmittedTooltip} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                         <h3 className="text-xl font-bold text-brand-on-surface-primary mb-4">Собственные инициативы</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatCard icon={<FilePlus2 size={24} className="text-white"/>} label="Внесено" value={lawTotals.own.contributed} colorClass="bg-brand-primary" />
                            <StatCard icon={<FileCheck2 size={24} className="text-white"/>} label="Принято" value={lawTotals.own.accepted} colorClass="bg-emerald-500" />
                         </div>
                    </div>

                     <div>
                         <h3 className="text-xl font-bold text-brand-on-surface-primary mb-4">Все законопроекты</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatCard icon={<Layers size={24} className="text-white"/>} label="Всего внесено" value={lawTotals.total.submitted} colorClass="bg-blue-500" />
                            <StatCard icon={<CheckCircle2 size={24} className="text-white"/>} label="Всего принято" value={lawTotals.total.accepted} colorClass="bg-emerald-500" />
                         </div>
                    </div>
                </div>
            </section>
            
            <section className="mt-6 p-6 bg-white rounded-xl shadow-sm flex-shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <LawSelector laws={allData.lawList} selectedLaw={selectedLaw} onSelect={setSelectedLaw} />
                    <CheckboxDropdown
                        title="Региональные отделения"
                        options={allData.regionOptions}
                        selectedOptions={selectedRegions}
                        onChange={setSelectedRegions}
                    />
                </div>
            </section>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 lg:h-[560px]">
                <main className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm flex flex-col min-h-0">
                     <div className="mb-4 flex-shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-brand-on-surface-primary truncate" title={selectedLaw}>
                                Статус по законопроекту
                            </h3>
                            <p className="text-sm text-brand-on-surface-secondary">{selectedLaw}</p>
                        </div>
                        <div className="relative w-full sm:w-72 mt-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Поиск по региону..."
                                value={regionSearch}
                                onChange={(e) => setRegionSearch(e.target.value)}
                                className="w-full bg-gray-50 text-brand-on-surface-primary placeholder:text-brand-on-surface-secondary pl-9 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6 flex-shrink-0">
                        {statusFilterOptions.map(statusKey => (
                            <button
                                key={statusKey}
                                onClick={() => setActiveStatusFilter(statusKey)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center space-x-2 ${activeStatusFilter === statusKey ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <span>{statusKey}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeStatusFilter === statusKey ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {statusCounts[statusKey] ?? 0}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 min-h-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredData.map(region => {
                                const status = region.federal_laws[selectedLaw];
                                const statusInfo = getStatusInfo(status);
                                return (
                                    <div key={region.region_name} className="border border-gray-100 rounded-lg p-4 relative">
                                        <button
                                            onClick={() => onViewDetails(region.region_name)}
                                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-brand-primary hover:bg-gray-100 rounded-full transition-colors"
                                            aria-label={`Детальная статистика по ${region.region_name}`}
                                        >
                                            <BarChart2 size={18} />
                                        </button>
                                        <h4 className="font-semibold text-brand-on-surface-primary mb-2 pr-8">{region.region_name}</h4>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: statusInfo.color }}></span>
                                            <p className="text-xs text-brand-on-surface-secondary">{status && status !== '-' ? status : 'Нет данных'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredData.length === 0 && (
                                <div className="col-span-full text-center py-16 text-gray-500 flex items-center justify-center">
                                    <p>Нет регионов, соответствующих вашим фильтрам.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                <aside className="bg-white p-6 rounded-xl shadow-sm flex flex-col min-h-0">
                    <div className="mb-4 flex-shrink-0">
                        <h3 className="text-lg font-bold text-brand-on-surface-primary">Прочие региональные инициативы</h3>
                        <p className="text-sm text-brand-on-surface-secondary">Найдено регионов: {otherInitiativesRegions.length}</p>
                    </div>
                    <div className="overflow-y-auto pr-2 flex-grow min-h-0">
                        <table className="w-full text-sm table-fixed">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr>
                                    <th className="w-1/2 text-left font-semibold text-gray-500 pb-2">Регион</th>
                                    <th className="w-1/4 text-center font-semibold text-gray-500 pb-2">Внесено</th>
                                    <th className="w-1/4 text-center font-semibold text-gray-500 pb-2">Принято</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otherInitiativesRegions.map(region => (
                                    <tr key={region.region_name} className="border-b border-gray-100 last:border-0">
                                        <td className="py-3 text-brand-on-surface-primary break-words">{region.region_name}</td>
                                        <td className="py-3 text-center font-semibold text-brand-on-surface-primary">{region.others.contributed}</td>
                                        <td className="py-3 text-center font-semibold text-brand-positive">{region.others.accepted}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </aside>
            </div>
        </div>
    );
};