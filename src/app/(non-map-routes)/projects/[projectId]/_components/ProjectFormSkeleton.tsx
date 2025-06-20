import React from "react";

const ProjectFormSkeleton = () => {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr,1.5fr] gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="h-6 w-24 rounded-xl bg-accent animate-pulse"></div>
          <div className="h-10 w-full rounded-xl bg-accent animate-pulse"></div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-6 w-24 rounded-xl bg-accent animate-pulse"></div>
          <div className="h-10 w-full rounded-xl bg-accent animate-pulse"></div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-6 w-24 rounded-xl bg-accent animate-pulse"></div>
          <div className="h-10 w-full rounded-xl bg-accent animate-pulse"></div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-6 w-24 rounded-xl bg-accent animate-pulse"></div>
          <div className="h-10 w-full rounded-xl bg-accent animate-pulse"></div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-6 w-24 rounded-xl bg-accent animate-pulse"></div>
          <div className="h-40 w-full rounded-xl bg-accent animate-pulse"></div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="h-6 w-24 rounded-xl bg-accent animate-pulse"></div>
          <div className="h-40 w-full rounded-xl bg-accent animate-pulse"></div>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="h-6 w-24 rounded-xl bg-accent animate-pulse"></div>
          <div className="flex-1 w-full rounded-xl bg-accent animate-pulse"></div>
        </div>{" "}
      </div>
    </div>
  );
};

export default ProjectFormSkeleton;
