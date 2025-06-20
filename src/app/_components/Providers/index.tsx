"use client";
import React from "react";
import PrivyProvider from "./PrivyProvider";
import { DialogProvider } from "../dialogs";
import QueryClientProvider from "./QueryClientProvider";
import { UserProvider } from "@/app/_contexts/User";
const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider>
      <PrivyProvider>
        <UserProvider>
          <DialogProvider>{children}</DialogProvider>
        </UserProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
};

export default Providers;
