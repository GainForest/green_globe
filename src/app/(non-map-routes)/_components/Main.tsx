"use client";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "../_contexts/Breadcrumbs";
import Link from "next/link";
import { AlertCircle, ChevronRight, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Fragment } from "react";
export function Main({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  const { breadcrumbs } = useBreadcrumbs();
  return (
    <main
      className={cn(
        "m-2 border border-border rounded-lg flex-1 bg-background overflow-y-auto",
        isMobile ? "ml-2" : open ? "ml-0" : "ml-2"
      )}
      style={{
        height: `calc(100svh - 1rem)`,
      }}
    >
      <div className="w-full sticky top-0 flex items-center p-2 border-b border-b-border bg-background/80 backdrop-blur-md z-10">
        <SidebarTrigger />
        <div className="h-6 w-0.5 rounded-full bg-muted mx-2"></div>
        <div className="flex-1 overflow-x-auto pr-2">
          <div className="flex items-center">
            {[{ label: "$home", href: "/" }, ...breadcrumbs].map(
              (breadcrumb, index) => {
                const isLast = index === breadcrumbs.length;
                return (
                  <Fragment key={breadcrumb.href}>
                    <Link href={breadcrumb.href}>
                      <Button
                        variant={"ghost"}
                        size={"sm"}
                        className="text-muted-foreground"
                      >
                        {breadcrumb.label === "$loading" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : breadcrumb.label === "$error" ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : breadcrumb.label === "$home" ? (
                          <Home className="w-4 h-4" />
                        ) : (
                          breadcrumb.label
                        )}
                      </Button>
                    </Link>
                    {!isLast && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    )}
                  </Fragment>
                );
              }
            )}
          </div>
        </div>
      </div>
      {children}
    </main>
  );
}
