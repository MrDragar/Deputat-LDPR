import React, { createContext, useState, useContext, useCallback } from 'react';
import { initialFederalPlanData } from '../data/federalPlanData';
import type { DailyPlan } from '../data/federalPlanData';
import { format } from 'date-fns';

interface FederalPlanContextType {
    plans: DailyPlan[];
    getPlanByDate: (date: string) => DailyPlan | undefined;
    addPlan: (newPlan: DailyPlan) => void;
    updatePlan: (updatedPlan: DailyPlan) => void;
    deletePlan: (date: string) => void;
}

const FederalPlanContext = createContext<FederalPlanContextType | null>(null);

export const FederalPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [plans, setPlans] = useState<DailyPlan[]>(initialFederalPlanData);

    const getPlanByDate = useCallback((date: string): DailyPlan | undefined => {
        return plans.find(plan => plan.date === date);
    }, [plans]);

    const addPlan = useCallback((newPlan: DailyPlan) => {
        setPlans(prevPlans => {
            const sortedPlans = [...prevPlans, newPlan].sort((a, b) => a.date.localeCompare(b.date));
            return sortedPlans;
        });
    }, []);

    const updatePlan = useCallback((updatedPlan: DailyPlan) => {
        setPlans(prevPlans => prevPlans.map(plan =>
            plan.date === updatedPlan.date ? updatedPlan : plan
        ));
    }, []);

    const deletePlan = useCallback((date: string) => {
        setPlans(prevPlans => prevPlans.filter(plan => plan.date !== date));
    }, []);
    

    const value = { plans, getPlanByDate, addPlan, updatePlan, deletePlan };

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
