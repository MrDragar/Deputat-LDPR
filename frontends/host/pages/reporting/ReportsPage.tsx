import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminReportsView from './AdminReportsView';
import AdminRegionReportsView from './AdminRegionReportsView';
import AdminRegionMonitoringView from './AdminRegionMonitoringView';
import CoordinatorReportsView from './CoordinatorReportsView';
import DeputyReportsView from './DeputyReportsView';

const ReportsPage: React.FC = () => {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;

    return (
        <Routes>
            <Route index element={
                user.role === 'admin' || user.role === 'employee' 
                    ? <AdminReportsView /> 
                    : user.role === 'coordinator' 
                        ? <CoordinatorReportsView /> 
                        : <DeputyReportsView />
            } />
            
            {/* Специфические маршруты админа */}
            {(user.role === 'admin' || user.role === 'employee') && (
                <>
                    <Route path="regions/:periodId" element={<AdminRegionReportsView />} />
                    <Route path="monitoring/:regionReportId" element={<AdminRegionMonitoringView />} />
                </>
            )}

            <Route path="*" element={<Navigate to="/reports" />} />
        </Routes>
    );
};

export default ReportsPage;