import React from "react";
import ClientAuthBoundary from "./_components/ClientAuthBoundary";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/Sidebar";
import { Main } from "./_components/Main";
import { BreadcrumbsProvider } from "./_contexts/Breadcrumbs";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <ClientAuthBoundary>
      <SidebarProvider className="bg-sidebar">
        <AppSidebar />
        <BreadcrumbsProvider>
          <Main>{children}</Main>
        </BreadcrumbsProvider>
      </SidebarProvider>
    </ClientAuthBoundary>
  );
};

export default Layout;
