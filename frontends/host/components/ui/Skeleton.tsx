import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={`bg-slate-200 animate-pulse rounded-md ${className}`}
      {...props}
    />
  );
};

export default Skeleton;
