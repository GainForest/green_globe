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
import { useAtproto } from "@/app/_components/Providers/atproto-provider";

type Props = {
  trigger?: React.ReactNode;
};

function validateHandle(handle: string): { isValid: boolean; error?: string } {
  if (!handle || handle.trim().length === 0) {
    return { isValid: false, error: 'Handle cannot be empty' };
  }
  
  const cleanHandle = handle.replace(/^@/, '').trim();

  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(cleanHandle)) {
    return { isValid: false, error: 'Invalid handle format. Use format: username.domain.com' };
  }

  if (cleanHandle.length > 253) {
    return { isValid: false, error: 'Handle too long (max 253 characters)' };
  }

  if (!cleanHandle.includes('.')) {
    return { isValid: false, error: 'Handle must include a domain (e.g., username.bsky.social)' };
  }
  
  return { isValid: true };
}

const SignInBlueskyDialog: React.FC<Props> = ({ trigger }) => {
  const { isAuthenticated, userProfile, signIn, signOut, refreshSession, error } = useAtproto();
  const [handle, setHandle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHandle = e.target.value;
    setHandle(newHandle);
    
    // Clear validation error on input change
    if (validationError) {
      setValidationError(null);
    }
  };

  const onSignIn = async () => {
    const validation = validateHandle(handle);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid handle');
      return;
    }
    
    try {
      setIsLoading(true);
      setValidationError(null);
      await signIn(handle.trim());
    } finally {
      setIsLoading(false);
    }
  };

  const authedName = userProfile?.displayName || userProfile?.handle || userProfile?.did;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">Account</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isAuthenticated ? "Your Account" : "Sign in with Bluesky"}</DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? "You are signed in via AT Protocol (Bluesky)."
              : "Enter your Bluesky handle to continue."}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="mt-2 space-y-3">
            <div className="space-y-1">
              <label className="block text-sm text-muted-foreground" htmlFor="bsky-handle">
                Bluesky handle
              </label>
              <Input
                id="bsky-handle"
                placeholder="yourname.bsky.social"
                value={handle}
                onChange={handleInputChange}
                disabled={isLoading}
              />
            </div>
            {(validationError || error) ? (
              <p className="text-sm text-red-600">{validationError || error}</p>
            ) : null}
            <div className="flex gap-2">
              <Button onClick={onSignIn} disabled={!handle || isLoading}>
                {isLoading ? "Redirecting…" : "Sign in with Bluesky"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="text-base font-medium">{authedName}</p>
            </div>
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshSession}>Refresh Session</Button>
              <Button variant="destructive" onClick={signOut}>Sign Out</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignInBlueskyDialog;

