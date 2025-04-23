import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const LoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Header with filter and export button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" /> {/* "Filter by:" text */}
          <Skeleton className="h-9 w-[200px] rounded-md" /> {/* Combobox */}
        </div>
        <Skeleton className="h-9 w-24 rounded-md" /> {/* Export button */}
      </div>

      {/* Tree data list */}
      <div className="mt-4">
        <div className="grid rounded-lg border border-border divide-y overflow-hidden">
          {/* Generate 5 skeleton items to represent tree data */}
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="bg-card p-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-40" /> {/* Species/height name */}
                  <Skeleton className="h-6 w-20 rounded-full" />{" "}
                  {/* Count badge */}
                </div>
                <Skeleton className="mt-2 h-2.5 w-full rounded-full" />{" "}
                {/* Progress bar */}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
