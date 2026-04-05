import React from "react";

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div
      className={`bg-gray-200 animate-pulse rounded ${className}`}
    ></div>
  );
};

export default Skeleton;

export const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <Skeleton className="p-6 w-12 h-12 rounded-lg" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-12" />
    </div>
  </div>
);

export const CandidateSkeleton = () => (
  <div className="p-6 flex justify-between items-center border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-4 flex-1">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="text-right hidden sm:block space-y-2">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-3 w-20 ml-auto" />
      </div>
      <Skeleton className="w-5 h-5 rounded" />
    </div>
  </div>
);
