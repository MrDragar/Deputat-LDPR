import React, { useMemo, useState } from 'react';
import { ArrowLeft, FilePlus2, FileCheck2, Info } from 'lucide-react';
import type { ProcessedLawData } from '../types';

interface LawmakingRegionDetailsProps {
    allData: ProcessedLawData;
    regionName: string;
    onBack: () => void;
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

const StatCardWithTooltip: React.FC<{
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-max z-20">
                    {tooltipContent}
                </div>
            )}
        </div>
    );
};

export const LawmakingRegionDetails: React.FC<LawmakingRegionDetailsProps> = ({ allData, regionName, onBack }) => {
    const regionData = useMemo(() => allData.dataByRegion[regionName], [allData, regionName]);

    const stats = useMemo(() => {
        if (!regionData) return null;

        const modelLaws = Object.values(regionData.federal_laws);
        const modelSubmittedCount = modelLaws.filter(s => typeof s === 'string' && (s.toLowerCase().startsWith('внесен лдпр') || s.toLowerCase().startsWith('принят по инициативе лдпр'))).length;
        const modelAdoptedCount = modelLaws.filter(s => typeof s === 'string' && s.toLowerCase().startsWith('принят по инициативе лдпр')).length;

        const ownSubmittedCount = regionData.others.contributed || 0;
        const ownAdoptedCount = regionData.others.accepted || 0;

        const totalSubmitted = modelSubmittedCount + ownSubmittedCount;
        const totalAdopted = modelAdoptedCount + ownAdoptedCount;

        return {
            modelSubmittedCount,
            modelAdoptedCount,
            ownSubmittedCount,
            ownAdoptedCount,
            totalSubmitted,
            totalAdopted,
        };
    }, [regionData]);

    if (!regionData || !stats) {
        return (
            <div className="container mx-auto p-8">
                <p>Не удалось найти данные для региона: {regionName}</p>
                <button onClick={onBack} className="mt-4 text-brand-primary">Назад</button>
            </div>
        );
    }
    
    const submittedTooltip = (
        <div className="w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-2xl text-xs">
            <div className="text-center mb-2">
                <p className="text-2xl font-bold text-brand-on-surface-primary">{stats.totalSubmitted}</p>
                <p className="font-semibold text-sm text-brand-on-surface-secondary">Всего внесено</p>
            </div>
            <hr className="mb-2 border-gray-100" />
            <ul className="space-y-1.5">
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span><span>Модельные законопроекты</span></div>
                    <span className="font-semibold text-gray-800">{stats.modelSubmittedCount}</span>
                </li>
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-2"></span><span>Собственные инициативы</span></div>
                    <span className="font-semibold text-gray-800">{stats.ownSubmittedCount}</span>
                </li>
            </ul>
        </div>
    );

     const adoptedTooltip = (
        <div className="w-64 p-3 bg-white border border-gray-200 rounded-xl shadow-2xl text-xs">
            <div className="text-center mb-2">
                <p className="text-2xl font-bold text-brand-on-surface-primary">{stats.totalAdopted}</p>
                <p className="font-semibold text-sm text-brand-on-surface-secondary">Всего принято</p>
            </div>
            <hr className="mb-2 border-gray-100" />
            <ul className="space-y-1.5">
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span><span>Модельные законопроекты</span></div>
                    <span className="font-semibold text-gray-800">{stats.modelAdoptedCount}</span>
                </li>
                <li className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 mr-2"></span><span>Собственные инициативы</span></div>
                    <span className="font-semibold text-gray-800">{stats.ownAdoptedCount}</span>
                </li>
            </ul>
        </div>
    );


    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
            <header className="flex items-center gap-4 flex-shrink-0">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-brand-on-surface-primary">{regionName}</h1>
                    <p className="text-brand-on-surface-secondary mt-1">Детальная статистика по законотворческой деятельности</p>
                </div>
            </header>

            <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <StatCardWithTooltip 
                    icon={<FilePlus2 size={24} className="text-white"/>} 
                    label="Всего внесено" 
                    value={stats.totalSubmitted} 
                    colorClass="bg-brand-primary"
                    tooltipContent={submittedTooltip}
                />
                <StatCardWithTooltip 
                    icon={<FileCheck2 size={24} className="text-white"/>} 
                    label="Всего принято" 
                    value={stats.totalAdopted} 
                    colorClass="bg-emerald-500"
                    tooltipContent={adoptedTooltip}
                />
            </section>

            <main className="mt-8 bg-white p-6 rounded-xl shadow-sm flex flex-col">
                 <h3 className="text-xl font-bold text-brand-on-surface-primary mb-6">Статус модельных законопроектов</h3>
                 <div className="overflow-y-auto pr-2 flex-grow min-h-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                         {allData.lawList.map(law => {
                             const status = regionData.federal_laws[law];
                             const statusInfo = getStatusInfo(status);
                             return (
                                 <div key={law} className="py-2 border-b border-gray-100 last:border-b-0">
                                     <h4 className="font-medium text-sm text-brand-on-surface-primary mb-1.5">{law}</h4>
                                     <div className="flex items-center space-x-2">
                                         <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusInfo.color }}></span>
                                         <p className="text-xs text-brand-on-surface-secondary">{status && status !== '-' ? status : 'Нет данных'}</p>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
            </main>
        </div>
    );
};
