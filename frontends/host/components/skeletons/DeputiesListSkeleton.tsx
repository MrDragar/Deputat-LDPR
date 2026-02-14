import React from 'react';
import Skeleton from '../ui/Skeleton';

const DeputiesListSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 fade-in">
            {/* Header & Filters Box */}
            <div className="bg-white p-4 sm:p-6 sm:rounded-xl sm:border border-gray-200 sm:shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-48 rounded-lg" /> {/* Title */}
                        <Skeleton className="h-6 w-12 rounded-full" /> {/* Count badge */}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2">
                             <Skeleton className="h-[50px] w-full rounded-lg" /> {/* Search Input */}
                        </div>
                         {/* Optional Region Dropdown placeholder */}
                    </div>
                    <div>
                        <Skeleton className="h-4 w-40 mb-3 rounded" /> {/* "Level" label */}
                        <div className="flex flex-wrap items-center gap-2">
                           {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-9 w-16 rounded-full" /> 
                           ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Desktop Table Skeleton */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 grid grid-cols-12 gap-4">
                    <Skeleton className="col-span-1 h-4 w-8 mx-auto" />
                    <Skeleton className="col-span-3 h-4 w-32" />
                    <Skeleton className="col-span-3 h-4 w-24" />
                    <Skeleton className="col-span-2 h-4 w-20" />
                    <Skeleton className="col-span-2 h-4 w-16 mx-auto" />
                    <Skeleton className="col-span-1 h-4 w-16 mx-auto" />
                </div>
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="px-6 py-5 grid grid-cols-12 gap-4 items-center">
                            <Skeleton className="col-span-1 h-5 w-5 rounded-full mx-auto" />
                            <div className="col-span-3 flex items-center gap-3">
                                <Skeleton className="h-4 w-3/4 rounded" />
                            </div>
                            <Skeleton className="col-span-3 h-4 w-1/2 rounded" />
                            <Skeleton className="col-span-2 h-4 w-20 rounded" />
                            <div className="col-span-2 flex justify-center">
                                <Skeleton className="h-6 w-12 rounded-md" />
                            </div>
                            <div className="col-span-1 flex justify-center">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile List Skeleton */}
            <div className="md:hidden bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <li key={i} className="flex items-start gap-4 p-5">
                            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0 space-y-2">
                                <Skeleton className="h-5 w-3/4 rounded" />
                                <Skeleton className="h-4 w-1/2 rounded" />
                                <div className="pt-1">
                                    <Skeleton className="h-5 w-12 rounded-md" />
                                </div>
                            </div>
                            <Skeleton className="h-5 w-5 rounded-full" />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DeputiesListSkeleton;