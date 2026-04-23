import React from "react";
import { cn } from "@/lib/utils";

const Container = ({
  children,
  outerClassName,
  ...props
}: {
  children: React.ReactNode;
  outerClassName?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("w-full flex flex-col items-center p-4", outerClassName)}
    >
      <div {...props} className={cn("w-full max-w-4xl", props.className)}>
        {children}
      </div>
    </div>
  );
};

export default Container;
