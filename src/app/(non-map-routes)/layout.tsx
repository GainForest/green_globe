import React from "react";
import ClientAuthBoundary from "./_components/ClientAuthBoundary";
import { getServerSession } from "next-auth/next";
import UnauthorizedPage from "./_components/UnauthorizedPage";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/Sidebar";
import { Main } from "./_components/Main";
import { authOptions } from "../api/auth/options";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  try {
    const session = await getServerSession(authOptions);
    console.log("session", session);
    if (!session?.address) {
      return <UnauthorizedPage />;
    }
  } catch (error) {
    console.error(
      "Serving Unauthorized Page because server session cannot be retrieved:",
      error
    );
    return <UnauthorizedPage />;
  }

  return (
    <ClientAuthBoundary>
      <SidebarProvider className="bg-sidebar">
        <AppSidebar />
        <Main>{children}</Main>
      </SidebarProvider>
    </ClientAuthBoundary>
  );
};

export default Layout;
