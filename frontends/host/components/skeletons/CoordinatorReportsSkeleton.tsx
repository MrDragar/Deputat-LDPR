import React from 'react';
import Skeleton from '../ui/Skeleton';

const CoordinatorReportsSkeleton: React.FC = () => {
    const SkeletonTableRow = () => (
        <tr className="bg-white border-b">
            <th scope="row" className="px-6 py-4">
                <Skeleton className="h-5 w-48 rounded" />
            </th>
            <td className="px-6 py-4 text-center">
                <Skeleton className="h-8 w-32 rounded-lg mx-auto" />
            </td>
            <td className="px-6 py-4 text-center">
                <Skeleton className="h-8 w-32 rounded-lg mx-auto" />
            </td>
            <td className="px-6 py-4 text-center">
                <Skeleton className="h-8 w-32 rounded-lg mx-auto" />
            </td>
        </tr>
    );
    
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-72 rounded" />
                    <Skeleton className="h-5 w-52 rounded" />
                </div>
                <Skeleton className="h-12 w-56 rounded-lg" />
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 w-1/3"><Skeleton className="h-4 w-24 rounded" /></th>
                            <th className="px-6 py-3 text-center"><Skeleton className="h-4 w-20 rounded mx-auto" /></th>
                            <th className="px-6 py-3 text-center"><Skeleton className="h-4 w-20 rounded mx-auto" /></th>
                            <th className="px-6 py-3 text-center"><Skeleton className="h-4 w-20 rounded mx-auto" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        <SkeletonTableRow />
                        <SkeletonTableRow />
                        <SkeletonTableRow />
                        <SkeletonTableRow />
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CoordinatorReportsSkeleton;
