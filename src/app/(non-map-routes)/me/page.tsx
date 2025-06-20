"use client";
import Container from "@/components/Container";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useStackedDialog } from "@/components/ui/StackedDialog/context";
import { blo } from "blo";
import { ArrowRight, Pencil, RefreshCcw } from "lucide-react";
import React, { useEffect, useState } from "react";
import LoadingMePage from "./loading";
import { useUserContext } from "@/app/_contexts/User";
import ErrorPage from "../_components/ErrorPage";
import { useBreadcrumbs } from "../_contexts/Breadcrumbs";
import NameEditor from "./_components/NameEditor";

const ProfileCTA = ({ children }: { children: React.ReactNode }) => {
  return (
    <button className="h-auto rounded-full bg-foreground/10 text-foreground px-2 py-1 text-xs flex items-center gap-1">
      {children}
    </button>
  );
};

const MePage = () => {
  const { openDialog } = useStackedDialog();
  const { backend: user, isPending, error } = useUserContext();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [nameEditMode, setNameEditMode] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: "Me", href: "/me" }]);
  }, [setBreadcrumbs]);

  if (error) {
    return (
      <ErrorPage
        error={error}
        title="Failed to load your profile"
        description="Please try refreshing the page..."
      />
    );
  }

  if (isPending) {
    return <LoadingMePage />;
  }

  if (!user) {
    return (
      <ErrorPage
        title="An error occured"
        description="Something went wrong while loading your profile. Please try refreshing the page..."
      />
    );
  }

  const fullName = `${user.first_name} ${user.last_name}`;
  return (
    <Container>
      <div className="w-full flex flex-col gap-2 items-center mt-8">
        <div className="rounded-full p-2 border-4 border-border">
          <Avatar className="h-20 w-20">
            <AvatarImage src={blo(user.wallet_address as `0x${string}`)} />
          </Avatar>
        </div>
        {nameEditMode ? (
          <NameEditor closeEditMode={() => setNameEditMode(false)} />
        ) : (
          <h1 className="text-2xl font-bold text-center text-balance">
            {fullName.trim() === "" ? (
              <span className="text-muted-foreground">No name provided</span>
            ) : (
              fullName
            )}
            {"   "}
            <Button
              size={"sm"}
              variant={"ghost"}
              onClick={() => setNameEditMode(true)}
            >
              <Pencil className="size-3" />
            </Button>
          </h1>
        )}
        <div className="mt-4 max-w-md w-full bg-accent/20 border border-border divide-y rounded-xl">
          <div className="flex flex-col gap-1 p-3">
            <p className="text-sm text-muted-foreground font-bold">Email</p>
            <p className="text-sm">
              {(user.email ?? "") === "" ? "No email provided" : user.email}
            </p>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <div className="w-full text-sm text-muted-foreground font-bold flex items-center justify-between gap-2">
              <span>Wallet Address</span>
              <span className="rounded-full bg-foreground/10 px-2 py-1 text-xs">
                {user.is_wallet_verified ? "Verified" : "Unverified"}
              </span>
            </div>
            <p className="text-sm truncate">{user.wallet_address}</p>
          </div>
          <div className="flex flex-col gap-1 p-3">
            <div className="w-full text-sm text-muted-foreground font-bold flex items-center justify-between gap-2">
              <span>Nationality</span>
              <ProfileCTA>
                {user.country_code && <RefreshCcw className="size-3" />}
                {user.country_code ? "Reverify" : "Verify"}
                {user.country_code === null && (
                  <ArrowRight className="size-3" />
                )}
              </ProfileCTA>
            </div>
            <p className="text-sm">
              {user.country_code ?? "Not verified yet..."}
            </p>
          </div>
        </div>
        <div className="mt-4 max-w-md w-full bg-accent/20 border border-border rounded-xl">
          <div className="flex items-center justify-between p-3">
            <span>Session</span>
            <Button variant={"secondary"} onClick={() => openDialog("account")}>
              Manage
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default MePage;
