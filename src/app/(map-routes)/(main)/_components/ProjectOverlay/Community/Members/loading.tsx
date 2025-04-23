import React from "react";

const Loading = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full h-24 rounded-xl bg-foreground/10 animate-pulse"></div>
      <div className="flex flex-col gap-2">
        <div className="w-full rounded-xl bg-foreground/10 flex items-start p-4 gap-4">
          <div className="w-16 h-16 rounded-full bg-foreground/10 animate-pulse"></div>
          <div className="flex flex-col gap-2">
            <div className="w-24 h-6 rounded-lg bg-foreground/10 animate-pulse delay-500"></div>
            <div className="w-40 h-6 rounded-lg bg-foreground/10 animate-pulse delay-500"></div>
          </div>
        </div>
        <div className="w-full rounded-xl bg-foreground/10 flex items-start p-4 gap-4">
          <div className="w-16 h-16 rounded-full bg-foreground/10 animate-pulse"></div>
          <div className="flex flex-col gap-2">
            <div className="w-24 h-6 rounded-lg bg-foreground/10 animate-pulse delay-500"></div>
            <div className="w-40 h-6 rounded-lg bg-foreground/10 animate-pulse delay-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
