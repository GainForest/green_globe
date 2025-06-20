"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogClose, DialogContent } from "@/components/ui/StackedDialog";
import { StackedDialogContext } from "@/components/ui/StackedDialog/context";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import React from "react";

const SignInEmail = ({ closeAll }: StackedDialogContext) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const { ready, authenticated } = usePrivy();
  const {
    sendCode,
    state: { status },
    loginWithCode,
  } = useLoginWithEmail();

  // status =  "initial" | "error" | "sending-code" | "awaiting-code-input" | "submitting-code" | "done"

  const shouldShowCodeInput =
    (status === "awaiting-code-input" || status === "submitting-code") &&
    !isEditingEmail;

  // Handle authentication state changes
  useEffect(() => {
    if (ready && authenticated) {
      closeAll();
    }
  }, [ready, authenticated, closeAll]);

  // Handle successful login
  useEffect(() => {
    if (status === "done") {
      closeAll();
    }
  }, [status, closeAll]);

  // Reset error message when status changes
  useEffect(() => {
    setErrorMessage(null);
  }, [status]);

  const handleSendCode = async () => {
    try {
      setErrorMessage(null);
      await sendCode({ email });
    } catch (error) {
      console.error("[SignInEmail] Failed to send verification code:", {
        email,
        error,
        timestamp: new Date().toISOString(),
        status,
      });
      setErrorMessage("Failed to send verification code. Please try again.");
    }
  };

  const handleVerifyCode = async () => {
    try {
      setErrorMessage(null);
      await loginWithCode({ code });
    } catch (error) {
      console.error("[SignInEmail] Failed to verify code:", {
        email,
        error,
        timestamp: new Date().toISOString(),
        status,
      });
      setErrorMessage("Invalid verification code. Please try again.");
    }
  };

  // If not ready, show loading state
  if (!ready) {
    return (
      <DialogContent
        title={<span className="font-serif">Sign in</span>}
        description="Loading..."
      >
        <div className="w-full flex justify-center py-8">
          <Loader2 className="size-8 animate-spin" />
        </div>
      </DialogContent>
    );
  }

  // If already authenticated, redirect (though useEffect will handle this)
  if (authenticated) {
    return null;
  }

  return (
    <DialogContent
      title={<span>Sign in</span>}
      description="Enter your email to sign in."
    >
      <div className="w-full flex flex-col gap-2 my-4">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="email-sign-in-input"
            className="has-[input:disabled]:text-muted-foreground"
          >
            Email
          </Label>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Input
                id="email-sign-in-input"
                placeholder="vitalik@ethereum.org"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={
                  status === "sending-code" ||
                  (shouldShowCodeInput && !isEditingEmail)
                }
              />
            </div>
            {shouldShowCodeInput && !isEditingEmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingEmail(true);
                  setErrorMessage(null);
                }}
                disabled={status === "submitting-code"}
              >
                Edit
              </Button>
            )}
            {isEditingEmail && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingEmail(false);
                  setErrorMessage(null);
                }}
                disabled={status === "sending-code"}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
        {shouldShowCodeInput && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code-sign-in-input">Code</Label>
            <Input
              id="code-sign-in-input"
              placeholder="123456"
              type="number"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={status === "submitting-code"}
            />
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-destructive/15 border border-destructive text-destructive text-sm rounded-md">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col w-full items-center gap-1">
        {shouldShowCodeInput ? (
          <Button
            className="w-full"
            onClick={handleVerifyCode}
            disabled={code.length === 0 || status === "submitting-code"}
          >
            {status === "submitting-code" ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" /> Verifying...
              </>
            ) : (
              <>
                Continue <ArrowRight className="ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={email.length === 0 || status === "sending-code"}
            onClick={handleSendCode}
          >
            {status === "sending-code" ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" /> Sending...
              </>
            ) : (
              <>
                Send Code <Mail className="ml-2" />
              </>
            )}
          </Button>
        )}
        <DialogClose closeTarget={"current"} asChild>
          <Button variant="outline" className="w-full">
            Back
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  );
};

export default SignInEmail;
