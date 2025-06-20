"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { useStackedDialog } from "@/components/ui/StackedDialog/context";
import { useCreateWallet, usePrivy } from "@privy-io/react-auth";

export default function UnauthorizedPage() {
  const { openDialog, isOpen } = useStackedDialog();
  const { createWallet } = useCreateWallet();
  const [creatingWallet, setCreatingWallet] = useState(false);
  const { ready, authenticated, getAccessToken, user } = usePrivy();

  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    const hasWallet = user.wallet?.address !== undefined;
    if (!hasWallet) {
      setCreatingWallet(true);
      createWallet()
        .then(() => {
          setCreatingWallet(false);
        })
        .catch((err) => {
          console.error("Unable to create wallet", err);
          setCreatingWallet(false);
        });
      return;
    }

    console.log("has wallet");

    setCreatingWallet(false);
  }, [ready, authenticated, user, user?.wallet, getAccessToken]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground">
            You need to sign in to access your projects.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              Signing in with an email or wallet allows you to view and manage
              your projects securely.
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              openDialog("onboarding");
            }}
            disabled={isOpen || (ready && authenticated)}
          >
            {ready
              ? authenticated
                ? creatingWallet
                  ? "Creating wallet..."
                  : "Signed in"
                : "Sign in"
              : "Please wait"}
          </Button>
        </div>
      </div>
    </div>
  );
}
