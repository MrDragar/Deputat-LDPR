import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminReportsView from './AdminReportsView';
import CoordinatorReportsView from './CoordinatorReportsView';
import DeputyReportsView from './DeputyReportsView';

const ReportsPage: React.FC = () => {
    const { user } = useAuth();

    switch (user?.role) {
        case 'admin':
        case 'employee':
            return <AdminReportsView />;
        case 'coordinator':
            return <CoordinatorReportsView />;
        case 'deputy':
            return <DeputyReportsView />;
        default:
            return (
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Отчётность</h1>
                    <p className="mt-2 text-gray-600">Для вашей роли нет доступных представлений.</p>
                </div>
            );
    }
};

export default ReportsPage;
