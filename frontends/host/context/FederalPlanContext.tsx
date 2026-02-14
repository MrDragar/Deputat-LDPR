import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { initialFederalPlanData, PartyImage } from '../data/federalPlanData';
import type { DailyPlan, PlanEvent } from '../data/federalPlanData';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { DateRange } from 'react-day-picker';

interface FederalPlanContextType {
    plans: DailyPlan[];
    loading: boolean;
    getPlanByDate: (date: string) => DailyPlan | undefined;
    addPlan: (newPlan: DailyPlan) => Promise<void>;
    updatePlan: (updatedPlan: DailyPlan) => Promise<void>;
    deletePlan: (date: string) => Promise<void>;
    refreshPlans: () => Promise<void>;
    // New state for date persistence
    dateRange: DateRange | undefined;
    setDateRange: (range: DateRange | undefined) => void;
}

const FederalPlanContext = createContext<FederalPlanContextType | null>(null);

// Mappers to translate between API (FastAPI snake_case + specific structure) and UI (camelCase + Record)
const mapApiToUi = (apiDay: any): DailyPlan => ({
    id: apiDay.id,
    date: apiDay.date,
    holidays: (apiDay.holidays || []).map((h: any) => h.name),
    events: (apiDay.events || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        partyImage: e.party_image as PartyImage,
        isInfostrike: e.is_infostrike,
        details: (e.details || []).reduce((acc: any, d: any) => {
            acc[d.name] = d.value;
            return acc;
        }, {})
    }))
});

const mapUiToApi = (uiPlan: DailyPlan): any => ({
    date: uiPlan.date,
    holidays: uiPlan.holidays.map(h => ({ name: h })),
    events: uiPlan.events.map(e => ({
        title: e.title,
        party_image: e.partyImage,
        is_infostrike: e.isInfostrike,
        details: Object.entries(e.details)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => ({ name: k, value: v }))
    }))
});

export const FederalPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [plans, setPlans] = useState<DailyPlan[]>(initialFederalPlanData);
    const [loading, setLoading] = useState(false);
    
    // Перенесли состояние даты сюда. При маунте провайдера (входе в раздел) оно инициализируется текущей датой.
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: undefined });

    const refreshPlans = useCallback(async () => {
        // Загружаем данные только если пользователь авторизован
        if (!isAuthenticated) return;
        
        setLoading(true);
        try {
            // Fetch list of days (short versions)
            const listResponse = await api.getFederalPlans(0, 1000); // Fetch up to 1000 days
            
            // To provide a full UI experience, we need full data for these days.
            // Since the API returns short responses, we fetch full details for all identified days.
            const fullPlansPromises = (listResponse?.items || []).map((item: any) => api.getFederalPlanById(item.id));
            const fullPlansRaw = await Promise.all(fullPlansPromises);
            
            const uiPlans = fullPlansRaw.map(mapApiToUi).sort((a, b) => a.date.localeCompare(b.date));
            setPlans(uiPlans);
        } catch (error) {
            console.error('Failed to load federal plans from API:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Следим за состоянием авторизации: загружаем при входе, очищаем при выходе
        if (isAuthenticated && !isAuthLoading) {
            refreshPlans();
        } else if (!isAuthenticated && !isAuthLoading) {
            setPlans([]);
            setLoading(false);
        }
    }, [isAuthenticated, isAuthLoading, refreshPlans]);

    const getPlanByDate = useCallback((date: string): DailyPlan | undefined => {
        return plans.find(plan => plan.date === date);
    }, [plans]);

    const addPlan = useCallback(async (newPlan: DailyPlan) => {
        try {
            const apiData = mapUiToApi(newPlan);
            const created = await api.createFederalPlan(apiData);
            const uiPlan = mapApiToUi(created);
            setPlans(prevPlans => {
                const updated = [...prevPlans, uiPlan].sort((a, b) => a.date.localeCompare(b.date));
                return updated;
            });
        } catch (error) {
            console.error('Failed to create federal plan:', error);
            throw error;
        }
    }, []);

    const updatePlan = useCallback(async (updatedPlan: DailyPlan) => {
        if (!updatedPlan.id) return;
        try {
            const apiData = mapUiToApi(updatedPlan);
            const updated = await api.updateFederalPlan(updatedPlan.id, apiData);
            const uiPlan = mapApiToUi(updated);
            setPlans(prevPlans => prevPlans.map(plan =>
                plan.id === uiPlan.id ? uiPlan : plan
            ));
        } catch (error) {
            console.error('Failed to update federal plan:', error);
            throw error;
        }
    }, []);

    const deletePlan = useCallback(async (date: string) => {
        const planToDelete = plans.find(p => p.date === date);
        if (!planToDelete || !planToDelete.id) return;
        
        try {
            await api.deleteFederalPlan(planToDelete.id);
            setPlans(prevPlans => prevPlans.filter(plan => plan.date !== date));
        } catch (error) {
            console.error('Failed to delete federal plan:', error);
            throw error;
        }
    }, [plans]);
    

    const value = { 
        plans, 
        loading, 
        getPlanByDate, 
        addPlan, 
        updatePlan, 
        deletePlan, 
        refreshPlans,
        dateRange,
        setDateRange
    };

    return (
        <FederalPlanContext.Provider value={value}>
            {children}
        </FederalPlanContext.Provider>
    );
};

export const useFederalPlan = (): FederalPlanContextType => {
    const context = useContext(FederalPlanContext);
    if (!context) {
        throw new Error('useFederalPlan must be used within a FederalPlanProvider');
    }
    return context;
};