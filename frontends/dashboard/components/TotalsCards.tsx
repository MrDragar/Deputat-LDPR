import React, { useMemo } from 'react';
import { DashboardCard } from './DashboardCard';
import type { ProcessedRegionalData, DeputyType, LawData } from '../types';
import { Users, UserCheck, Mic, Clipboard, BarChart2, ClipboardCheck } from 'lucide-react';

interface TotalsCardsProps {
    periodData: ProcessedRegionalData[];
    lawData: LawData[] | null;
    selectedTypes: DeputyType[];
    selectedRegions: string[];
    comparisonData: {
        totalDeputies: number;
        interactingDeputies: number;
        receptionDeputies: number;
        totalAppeals: number;
        comparisonPeriodLabel: string;
    } | null;
    onViewAppeals: () => void;
    onViewAllRegionsDetails: () => void;
    onViewLawmaking: () => void;
    selectedDatesCount: number;
}

export const TotalsCards: React.FC<TotalsCardsProps> = ({ 
    periodData, 
    lawData,
    selectedTypes, 
    selectedRegions, 
    comparisonData, 
    onViewAppeals, 
    onViewAllRegionsDetails,
    onViewLawmaking,
    selectedDatesCount 
}) => {
    
    const shouldShowAggregatedCounts = selectedDatesCount <= 1;

    const totals = useMemo(() => {
        let totalDeputies = 0;
        let interactingDeputies = 0;
        let receptionDeputies = 0;
        let totalAppeals = 0;
       
        const dataToProcess = selectedRegions.length > 0
            ? periodData.filter(d => selectedRegions.includes(d.region))
            : periodData;

        dataToProcess.forEach(row => {
            if (selectedTypes.length > 0) {
                selectedTypes.forEach(type => {
                    const stats = row.data[type];
                    if (stats) {
                        totalDeputies += stats.total;
                        interactingDeputies += stats.interacting;
                        receptionDeputies += stats.reception;
                    }
                });
            }
            totalAppeals += Object.values(row.appeals).reduce((sum, count) => sum + count, 0);
        });
        
        return {
            totalDeputies,
            interactingDeputies,
            receptionDeputies,
            totalAppeals,
        };
    }, [periodData, selectedTypes, selectedRegions]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
                title="Общее количество
депутатов"
                value={shouldShowAggregatedCounts ? totals.totalDeputies.toLocaleString('ru-RU') : '—'}
                change={comparisonData?.totalDeputies}
                comparisonLabel={comparisonData?.comparisonPeriodLabel}
                icon={<Users className="text-white" size={24} />}
                colorClass="bg-[#10B981]"
                onActionClick={onViewAllRegionsDetails}
                actionIcon={<BarChart2 size={20} />}
            />
            <DashboardCard
                title="Общее количество взаимодействующих"
                value={shouldShowAggregatedCounts ? totals.interactingDeputies.toLocaleString('ru-RU') : '—'}
                change={comparisonData?.interactingDeputies}
                comparisonLabel={comparisonData?.comparisonPeriodLabel}
                icon={<UserCheck className="text-white" size={24} />}
                colorClass="bg-[#3B82F6]"
            />
            <DashboardCard
                title="Общее количество, проводивших прием"
                value={shouldShowAggregatedCounts ? totals.receptionDeputies.toLocaleString('ru-RU') : '—'}
                change={comparisonData?.receptionDeputies}
                comparisonLabel={comparisonData?.comparisonPeriodLabel}
                icon={<Mic className="text-white" size={24} />}
                colorClass="bg-[#8B5CF6]"
            />
             <DashboardCard
                title="Модельные законопроекты"
                value={"21"}
                icon={<ClipboardCheck className="text-white" size={24} />}
                colorClass="bg-[#F97316]"
                onActionClick={onViewLawmaking}
                actionIcon={<BarChart2 size={20} />}
            />
            <DashboardCard
                title="Общая статистика по обращениям"
                value={totals.totalAppeals.toLocaleString('ru-RU')}
                change={comparisonData?.totalAppeals}
                comparisonLabel={comparisonData?.comparisonPeriodLabel}
                icon={<Clipboard className="text-white" size={24} />}
                colorClass="bg-[#EF4444]"
                onActionClick={onViewAppeals}
                actionIcon={<BarChart2 size={20} />}
            />
        </div>
    );
};