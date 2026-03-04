"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAtprotoStore } from "@/app/_components/stores/atproto";
import { authorize, logout } from "@/app/_components/actions/oauth";
import { allowedPDSDomains } from "@/config/gainforest-sdk";

type Props = {
  trigger?: React.ReactNode;
};

const SignInBlueskyDialog: React.FC<Props> = ({ trigger }) => {
  const auth = useAtprotoStore((state) => state.auth);
  const setAuth = useAtprotoStore((state) => state.setAuth);
  const [handle, setHandle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    if (!handle.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const { authorizationUrl } = await authorize(handle.trim());
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate sign in");
      setIsLoading(false);
    }
  };

  const onSignOut = async () => {
    await logout();
    setAuth(null);
  };

  const isAuthenticated = auth.authenticated;
  const user = auth.authenticated ? auth.user : null;
  const authedName = user?.displayName || user?.handle || user?.did;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline" size="sm">Account</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isAuthenticated ? "Your Account" : "Sign in with ClimateAI"}</DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? "You are signed in via AT Protocol."
              : "Enter your handle to continue."}
          </DialogDescription>
        </DialogHeader>
        {!isAuthenticated ? (
          <div className="mt-2 space-y-3">
            <div className="space-y-1">
              <label className="block text-sm text-muted-foreground" htmlFor="atproto-handle">
                Handle
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">@</span>
                <Input
                  id="atproto-handle"
                  placeholder="your-handle"
                  value={handle}
                  onChange={(e) => { setHandle(e.target.value); setError(null); }}
                  disabled={isLoading}
                  onKeyDown={(e) => { if (e.key === "Enter" && handle.trim()) onSignIn(); }}
                />
                <span className="text-sm text-muted-foreground">.{allowedPDSDomains[0]}</span>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={onSignIn} disabled={!handle.trim() || isLoading}>
              {isLoading ? "Redirecting…" : "Sign in"}
            </Button>
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="text-base font-medium">{authedName}</p>
            </div>
            <Button variant="destructive" onClick={onSignOut}>Sign Out</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignInBlueskyDialog;
