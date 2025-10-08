"use client";
import React from "react";
import QueryClientProvider from "./QueryClientProvider";
import AtprotoProvider from "@/app/_components/Providers/atproto-provider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider>
      <AtprotoProvider>{children}</AtprotoProvider>
    </QueryClientProvider>
  );
};

export default Providers;
