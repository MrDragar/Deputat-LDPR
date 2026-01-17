import './index.css'  // Импорт Tailwind CSS

import React, { useState, useMemo, useEffect } from 'react';
import { TotalsCards } from './components/TotalsCards';
import { DEPUTY_TYPE_FILTERS } from './constants';
import type { DeputyType, ProcessedData, ProcessedRegionalData, LawData, ProcessedLawData } from './types';
import { CheckboxDropdown } from './components/CheckboxDropdown';
import { RegionalAnalysis } from './components/RegionalAnalysis';
import { ToggleButtonGroup } from './components/ToggleButtonGroup';
import { DetailedAnalytics } from './components/DetailedAnalytics';
import { dataProcessor } from './utils/dataProcessor';
import { AppealsPage } from './components/AppealsPage';
import { AllRegionsAnalytics } from './components/AllRegionsAnalytics';
import { lawDataProcessor } from './utils/lawDataProcessor';
import { LawmakingAnalytics } from './components/LawmakingAnalytics';
import { LawmakingRegionDetails } from './components/LawmakingRegionDetails';

const baseUrl = import.meta.env.BASE_URL;
const App: React.FC = () => {
    const [view, setView] = useState<{ screen: 'dashboard' | 'details' | 'appeals' | 'all_regions_details' | 'lawmaking' | 'lawmaking_details'; region?: string }>({ screen: 'dashboard' });

    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [processedLawData, setProcessedLawData] = useState<ProcessedLawData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Filter and Sort State
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [selectedDeputyTypes, setSelectedDeputyTypes] = useState<DeputyType[]>(['zs', 'acs', 'omsu']);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [sortKey, setSortKey] = useState<string>('total');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [comparisonRegions, setComparisonRegions] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [resResponse, lawResponse] = await Promise.all([
                fetch(`${baseUrl}data/res.json`),
                fetch(`${baseUrl}data/law_res.json`)
                ]);

                if (!resResponse.ok) {
                    throw new Error(`HTTP error! status: ${resResponse.status} for res.json`);
                }
                 if (!lawResponse.ok) {
                    throw new Error(`HTTP error! status: ${lawResponse.status} for law_res.json`);
                }

                const rawData = await resResponse.json();
                const rawLawData = await lawResponse.json();

                const data = dataProcessor(rawData);
                const lawData = lawDataProcessor(rawLawData);

                setProcessedData(data);
                setProcessedLawData(lawData);

                if (data.dateOptions.length > 0) {
                   setSelectedDates([data.dateOptions[data.dateOptions.length - 1].value]); // Select latest date by default
                }
            } catch (e) {
                console.error("Failed to fetch or process data:", e);
                setError('Не удалось загрузить данные. Проверьте наличие файлов res.json и law_res.json в папке public/data и их формат.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const regionOptions = useMemo(() => processedData?.regionOptions ?? [], [processedData]);

    const handleDeputyTypeChange = (type: string) => {
        const value = type as DeputyType;
        setSelectedDeputyTypes(prev =>
            prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
        );
    };

    const handleViewDetails = (region: string) => {
        setView({ screen: 'details', region });
    };

    const handleBackToDashboard = () => {
        setView({ screen: 'dashboard' });
    };

    const handleViewAppeals = () => {
        setView({ screen: 'appeals' });
    };

    const handleViewLawmaking = () => {
        setView({ screen: 'lawmaking' });
    };

    const handleViewLawmakingDetails = (region: string) => {
        setView({ screen: 'lawmaking_details', region });
    };

    const handleViewAllRegionsDetails = () => {
        if (processedData && selectedRegions.length === 0) {
            setSelectedRegions(processedData.regionOptions);
        }
        setView({ screen: 'all_regions_details' });
    };

    const aggregatedDataForSelectedPeriods = useMemo(() => {
        if (!processedData || selectedDates.length === 0) return [];

        const aggregatedMap = new Map<string, ProcessedRegionalData>();

        selectedDates.forEach(date => {
            const periodData = processedData.dataByDate[date];
            if (!periodData || !periodData.statisticsByRegion) return;

            const statsForPeriod = Object.values(periodData.statisticsByRegion);

            statsForPeriod.forEach(regionStat => {
                const regionName = regionStat.region;
                let existingData = aggregatedMap.get(regionName);

                if (!existingData) {
                    // Initialize a new structure for the region if it doesn't exist
                    existingData = {
                        region: regionStat.region,
                        totalCitizens: 0,
                        appeals: {},
                        data: {
                            zs: { total: 0, interacting: 0, reception: 0 },
                            acs: { total: 0, interacting: 0, reception: 0 },
                            omsu: { total: 0, interacting: 0, reception: 0 },
                        },
                    };
                    aggregatedMap.set(regionName, existingData);
                }

                // Add current period's data to the aggregated data
                existingData.totalCitizens += regionStat.totalCitizens;

                (Object.keys(regionStat.data) as DeputyType[]).forEach(deputyType => {
                    const typeStats = existingData.data[deputyType];
                    const regionTypeStats = regionStat.data[deputyType];
                    if (typeStats && regionTypeStats) {
                        typeStats.total += regionTypeStats.total ?? 0;
                        typeStats.interacting += regionTypeStats.interacting ?? 0;
                        typeStats.reception += regionTypeStats.reception ?? 0;
                    }
                });

                Object.entries(regionStat.appeals).forEach(([appealType, count]) => {
                    if (!existingData.appeals[appealType]) {
                        existingData.appeals[appealType] = 0;
                    }
                    existingData.appeals[appealType] += count;
                });
            });
        });
        return Array.from(aggregatedMap.values());
    }, [processedData, selectedDates]);

    const comparisonTotals = useMemo(() => {
        if (!processedData || selectedDates.length !== 1) return null;

        const selectedDate = selectedDates[0];
        const dateIndex = processedData.dateOptions.findIndex(d => d.value === selectedDate);

        if (dateIndex < 1) return null;

        const previousDateOption = processedData.dateOptions[dateIndex - 1];
        const previousDateValue = previousDateOption.value;

        const calculateTotalsForDate = (dateValue: string) => {
            let totalDeputies = 0;
            let interactingDeputies = 0;
            let receptionDeputies = 0;
            let totalAppeals = 0;

            const periodData = processedData.dataByDate[dateValue]?.statisticsByRegion ?? {};
            const allRegionStats = Object.values(periodData);

            const dataToProcess = selectedRegions.length > 0
                ? allRegionStats.filter(d => selectedRegions.includes(d.region))
                : allRegionStats;

            dataToProcess.forEach(row => {
                if (selectedDeputyTypes.length > 0) {
                    selectedDeputyTypes.forEach(type => {
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

            return { totalDeputies, interactingDeputies, receptionDeputies, totalAppeals };
        };

        const currentTotals = calculateTotalsForDate(selectedDate);
        const previousTotals = calculateTotalsForDate(previousDateValue);

        return {
            totalDeputies: currentTotals.totalDeputies - previousTotals.totalDeputies,
            interactingDeputies: currentTotals.interactingDeputies - previousTotals.interactingDeputies,
            receptionDeputies: currentTotals.receptionDeputies - previousTotals.receptionDeputies,
            totalAppeals: currentTotals.totalAppeals - previousTotals.totalAppeals,
            comparisonPeriodLabel: previousDateOption.label
        };

    }, [processedData, selectedDates, selectedRegions, selectedDeputyTypes]);


    const renderDashboard = () => (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-brand-on-surface-primary">Сводный отчет по ВДПГ</h1>
                <p className="text-brand-on-surface-secondary mt-1">Анализ активности депутатов по региональным отделениям</p>
            </header>

            <section className="mb-8 p-6 bg-brand-surface rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <CheckboxDropdown
                        title="Отчетный период"
                        options={processedData?.dateOptions ?? []}
                        selectedOptions={selectedDates}
                        onChange={setSelectedDates}
                    />
                     <CheckboxDropdown
                        title="Региональные отделения"
                        options={regionOptions}
                        selectedOptions={selectedRegions}
                        onChange={setSelectedRegions}
                    />
                    <ToggleButtonGroup
                        title="Уровень представительства"
                        options={DEPUTY_TYPE_FILTERS}
                        selectedOptions={selectedDeputyTypes}
                        onChange={handleDeputyTypeChange}
                    />
                </div>
            </section>

            <TotalsCards
                periodData={aggregatedDataForSelectedPeriods}
                lawData={processedLawData ? Object.values(processedLawData.dataByRegion) : null}
                selectedTypes={selectedDeputyTypes}
                selectedRegions={selectedRegions}
                comparisonData={comparisonTotals}
                onViewAppeals={handleViewAppeals}
                onViewAllRegionsDetails={handleViewAllRegionsDetails}
                onViewLawmaking={handleViewLawmaking}
                selectedDatesCount={selectedDates.length}
            />

            <section className="mt-8">
                <RegionalAnalysis
                    periodData={aggregatedDataForSelectedPeriods}
                    selectedRegions={selectedRegions}
                    selectedDeputyTypes={selectedDeputyTypes}
                    onViewDetails={handleViewDetails}
                    allData={processedData}
                    selectedDates={selectedDates}
                    sortKey={sortKey}
                    onSortKeyChange={setSortKey}
                    sortDirection={sortDirection}
                    onSortDirectionChange={setSortDirection}
                    comparisonRegions={comparisonRegions}
                    onComparisonRegionsChange={setComparisonRegions}
                />
            </section>
        </div>
    );

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><p className="text-xl">Загрузка данных...</p></div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen"><p className="text-xl text-red-500 p-8">{error}</p></div>;
    }

    return (
        <div className="bg-brand-background min-h-screen text-brand-on-surface-primary font-inter">
            {view.screen === 'dashboard' && renderDashboard()}
            {view.screen === 'details' && processedData && view.region && (
                <DetailedAnalytics
                    allData={processedData}
                    regionName={view.region}
                    onBack={handleBackToDashboard}
                    selectedDeputyTypes={selectedDeputyTypes}
                    onDeputyTypeChange={handleDeputyTypeChange}
                    selectedDates={selectedDates}
                    onDatesChange={setSelectedDates}
                />
            )}
            {view.screen === 'appeals' && processedData && (
                 <AppealsPage
                    allData={processedData}
                    onBack={handleBackToDashboard}
                    selectedRegions={selectedRegions}
                    onRegionsChange={setSelectedRegions}
                    selectedDates={selectedDates}
                    onDatesChange={setSelectedDates}
                />
            )}
             {view.screen === 'lawmaking' && processedLawData && (
                 <LawmakingAnalytics
                    allData={processedLawData}
                    onBack={handleBackToDashboard}
                    onViewDetails={handleViewLawmakingDetails}
                />
            )}
            {view.screen === 'lawmaking_details' && processedLawData && view.region && (
                 <LawmakingRegionDetails
                    allData={processedLawData}
                    regionName={view.region}
                    onBack={() => setView({ screen: 'lawmaking' })}
                />
            )}
            {view.screen === 'all_regions_details' && processedData && (
                 <AllRegionsAnalytics
                    allData={processedData}
                    onBack={handleBackToDashboard}
                    selectedDeputyTypes={selectedDeputyTypes}
                    onDeputyTypeChange={handleDeputyTypeChange}
                    selectedDates={selectedDates}
                    onDatesChange={setSelectedDates}
                    selectedRegions={selectedRegions}
                    onRegionsChange={setSelectedRegions}
                />
            )}
        </div>
    );
};

export default App;