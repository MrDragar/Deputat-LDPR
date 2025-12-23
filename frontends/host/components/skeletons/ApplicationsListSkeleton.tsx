import React from 'react';
import Skeleton from '../ui/Skeleton';
import { ChevronRight } from 'lucide-react';

const SkeletonListItem = () => (
    <li className="flex items-start gap-4 p-4 sm:p-6">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 pt-1">
            <Skeleton className="h-5 w-48 rounded-md" />
            <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-64 rounded-md" />
                <Skeleton className="h-4 w-52 rounded-md" />
            </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-300 ml-4 flex-shrink-0 self-center" />
    </li>
);

const ApplicationsListSkeleton: React.FC = () => {
    return (
        <div className="fade-in">
            <div className="flex items-center gap-4 mb-6">
                <Skeleton className="h-9 w-80 rounded-md" />
                <Skeleton className="h-8 w-12 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
            </div>
            
            <hr className="mb-6 border-gray-200" />

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    <SkeletonListItem />
                    <SkeletonListItem />
                    <SkeletonListItem />
                    <SkeletonListItem />
                    <SkeletonListItem />
                </ul>
            </div>
        </div>
    );
};

export default ApplicationsListSkeleton;
