"use client";
import React from "react";
import QueryClientProvider from "./QueryClientProvider";
import AtprotoProvider from "@/app/_components/Providers/atproto-provider";
import { TrpcProvider } from "./trpc-provider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <TrpcProvider>
      <QueryClientProvider>
        <AtprotoProvider>{children}</AtprotoProvider>
      </QueryClientProvider>
    </TrpcProvider>
  );
};

export default Providers;
