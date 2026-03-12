import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SkeletonCard({ count = 3 }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-[#0C121C] border border-[#19E0FF]/10 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-xl bg-[#19E0FF]/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 bg-[#19E0FF]/10" />
              <Skeleton className="h-4 w-1/2 bg-[#19E0FF]/10" />
            </div>
          </div>
          <Skeleton className="h-10 w-full bg-[#19E0FF]/10" />
        </div>
      ))}
    </div>
  );
}