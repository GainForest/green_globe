"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import SignInBlueskyDialog from "@/app/_components/dialogs/SignInBluesky";
import { useAtproto } from "@/app/_components/Providers/atproto-provider";

const AccountButton = () => {
  const { isAuthenticated, userProfile } = useAtproto();
  const label = isAuthenticated
    ? userProfile?.displayName || userProfile?.handle || "Account"
    : "Sign in";

  return (
    <SignInBlueskyDialog
      trigger={
        <Button variant="outline" size="sm">
          {label}
        </Button>
      }
    />
  );
};

export default AccountButton;

