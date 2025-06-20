"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { blo } from "blo";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPinned } from "lucide-react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function AppSidebar() {
  const { ready, authenticated, user } = usePrivy();
  const pathname = usePathname();

  const address = user?.wallet?.address;

  return (
    <Sidebar className="border-r-transparent">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 p-1">
          <Image
            src="/assets/logo.webp"
            className="border border-border rounded-md"
            alt="logo"
            width={32}
            height={32}
          />
          <span className="font-bold">GainForest</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <Link href="/projects">
              <Button
                variant={
                  pathname.startsWith("/projects") ? "secondary" : "ghost"
                }
                size={"sm"}
                className="w-full justify-start"
              >
                <MapPinned className="w-4 h-4" />
                Projects
              </Button>
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {ready && authenticated && (
          <div className="border border-border p-3 rounded-xl">
            {!address && "Loading..."}
            {address && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage
                      src={blo(address as `0x${string}`)}
                      alt="avatar"
                    />
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                      Signed in as
                    </span>
                    <span className="text-sm font-bold">
                      {user.email?.address
                        ? user.email.address.slice(0, 10) + "..."
                        : truncateAddress(address)}
                    </span>
                  </div>
                </div>
                <Link href="/me">
                  <Button variant={"secondary"} className="w-full" size={"sm"}>
                    Account Options
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
