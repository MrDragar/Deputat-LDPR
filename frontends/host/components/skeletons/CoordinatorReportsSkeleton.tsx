import React from 'react';
import Skeleton from '../ui/Skeleton';

const CoordinatorReportsSkeleton: React.FC = () => {
    const SkeletonPeriodItem = ({ isFirst = false }) => (
        <div className={`${!isFirst ? 'border-t border-gray-200' : ''}`}>
            <div className="p-4 sm:p-6 flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 sm:h-6 w-48 rounded" />
                        <Skeleton className="h-4 w-32 rounded" />
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-2">
                    <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" />
                    <Skeleton className="hidden sm:block h-10 w-32 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                </div>
            </div>
            {/* Expanded content for the first item */}
            {isFirst && (
                <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/30">
                    <div className="sm:hidden flex gap-2 mb-4">
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </div>
            )}
        </div>
    );
    
    return (
        <div className="max-w-full space-y-4 animate-pulse pt-4 sm:pt-0 pb-8 sm:pb-0">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-4 sm:px-0">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-48 rounded" />
                    <Skeleton className="h-6 w-8 rounded-full" />
                </div>
            </header>
            
            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="hidden sm:block h-5 w-24 rounded" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="hidden sm:block h-5 w-24 rounded" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="hidden sm:block h-5 w-24 rounded" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white sm:rounded-xl sm:border border-gray-200 overflow-hidden">
                    <SkeletonPeriodItem isFirst={true} />
                    <SkeletonPeriodItem />
                    <SkeletonPeriodItem />
                    <SkeletonPeriodItem />
                </div>
            </div>
        </div>
    );
};

export default CoordinatorReportsSkeleton;
