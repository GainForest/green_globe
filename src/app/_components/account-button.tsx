"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import SignInBlueskyDialog from "@/app/_components/dialogs/SignInBluesky";
import { useAtprotoStore } from "@/app/_components/stores/atproto";

const AccountButton = () => {
  const auth = useAtprotoStore((state) => state.auth);
  const label = auth.authenticated
    ? auth.user.displayName || auth.user.handle || "Account"
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

