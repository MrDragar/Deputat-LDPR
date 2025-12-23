import React from 'react';
import Skeleton from '../ui/Skeleton';

const SkeletonSection: React.FC = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-48 rounded-md" />
        </div>
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-5 w-1/2 rounded-md" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-5 w-1/3 rounded-md" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-5 w-2/3 rounded-md" />
            </div>
        </div>
    </div>
);


const ApplicationDetailSkeleton: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto fade-in">
            <Skeleton className="h-5 w-56 mb-6 rounded-md" />

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div className="w-full sm:w-2/3">
                    <Skeleton className="h-9 w-full rounded-md mb-2" />
                    <Skeleton className="h-5 w-1/2 rounded-md" />
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
                    <Skeleton className="h-12 w-full sm:w-28 rounded-lg" />
                    <Skeleton className="h-12 w-full sm:w-28 rounded-lg" />
                </div>
            </div>
            
            <main className="space-y-8">
                <SkeletonSection />
                <SkeletonSection />
                <SkeletonSection />
            </main>
        </div>
    );
};

export default ApplicationDetailSkeleton;
