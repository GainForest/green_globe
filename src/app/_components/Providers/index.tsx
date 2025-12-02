"use client";
import React from "react";
import AtprotoProvider from "@/app/_components/Providers/atproto-provider";
import { TrpcProvider } from "@/components/providers/TRPCProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <TrpcProvider>
      <AtprotoProvider>{children}</AtprotoProvider>
    </TrpcProvider>
  );
};

export default Providers;
