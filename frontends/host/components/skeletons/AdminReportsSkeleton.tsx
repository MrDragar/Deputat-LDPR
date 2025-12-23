import React from 'react';
import Skeleton from '../ui/Skeleton';
import { Edit, Trash2 } from 'lucide-react';

const AdminReportsSkeleton: React.FC = () => {
    const SkeletonReportItem = () => (
        <li className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
            <div className="space-y-2">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-4 w-64 rounded" />
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
                 <Skeleton className="h-9 w-9 rounded-full" />
                 <Skeleton className="h-9 w-9 rounded-full" />
            </div>
        </li>
    );

    const SkeletonPeriodCard = () => (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48 rounded" />
                    <Skeleton className="h-4 w-40 rounded" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </div>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-5 w-48 rounded" />
                    <Skeleton className="h-9 w-36 rounded-lg" />
                </div>
                <ul className="space-y-3">
                    <SkeletonReportItem />
                    <SkeletonReportItem />
                </ul>
            </div>
        </div>
    );


    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-80 rounded" />
                    <Skeleton className="h-5 w-96 rounded" />
                </div>
                <Skeleton className="h-12 w-44 rounded-lg" />
            </div>

            <SkeletonPeriodCard />
            <SkeletonPeriodCard />
      </div>
    );
};

export default AdminReportsSkeleton;
