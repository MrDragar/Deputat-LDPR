import React from 'react';
import Skeleton from '../ui/Skeleton';

const DeputyReportsSkeleton: React.FC = () => {
    const SkeletonListItem = () => (
        <li className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 space-y-2 w-full">
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-4 w-full sm:w-2/3 rounded" />
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto pt-4 sm:pt-0">
                <Skeleton className="h-12 w-full sm:w-48 rounded-lg" />
            </div>
        </li>
    );

    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2">
                <Skeleton className="h-8 w-64 rounded" />
                <Skeleton className="h-5 w-52 rounded" />
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <ul className="divide-y divide-gray-200">
                    <SkeletonListItem />
                    <SkeletonListItem />
                    <SkeletonListItem />
                </ul>
            </div>
        </div>
    );
};

export default DeputyReportsSkeleton;
