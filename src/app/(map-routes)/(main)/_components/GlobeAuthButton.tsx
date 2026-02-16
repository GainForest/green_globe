"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAtproto } from "@/app/_components/Providers/AtprotoProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function GlobeAuthButton() {
  const { isInitialized, isAuthenticated, userProfile, signIn, signOut } = useAtproto();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [handle, setHandle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const normalizedHandle = handle.includes(".") ? handle : `${handle}.bsky.social`;
      await signIn(normalizedHandle);
      // signIn will redirect the browser, so execution stops here
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
  };

  // Loading state
  if (!isInitialized) {
    return (
      <div className="fixed top-4 right-4 z-[30]">
        <Button variant="ghost" size="sm" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      </div>
    );
  }

  // Authenticated state
  if (isAuthenticated && userProfile) {
    return (
      <div className="fixed top-4 right-4 z-[30]" ref={dropdownRef}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDropdown((prev) => !prev)}
          className="bg-background/80 backdrop-blur-sm border-border/50 shadow-lg"
        >
          <div className="flex items-center gap-2">
            {userProfile.avatar ? (
              <Image
                src={userProfile.avatar}
                alt={userProfile.handle}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                {(userProfile.displayName || userProfile.handle).charAt(0).toUpperCase()}
              </div>
            )}
            <span className="max-w-[120px] truncate">
              {userProfile.displayName || userProfile.handle}
            </span>
          </div>
        </Button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-lg shadow-lg py-1 z-50">
            <a
              href={`/profile/${userProfile.did}`}
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              My Profile
            </a>
            <div className="h-px bg-border my-1" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Not authenticated state
  return (
    <>
      <div className="fixed top-4 right-4 z-[30]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          className="bg-background/80 backdrop-blur-sm border-border/50 shadow-lg"
        >
          Sign in
        </Button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative w-full max-w-sm bg-background rounded-lg shadow-lg border p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-1">
              Sign in with ATProto
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Enter your Bluesky handle to connect.
            </p>

            <form onSubmit={handleSignIn}>
              <Label htmlFor="auth-handle" className="text-sm mb-1.5">
                Handle
              </Label>
              <Input
                id="auth-handle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="alice.bsky.social"
                disabled={isSubmitting}
                autoFocus
                className="mb-1.5"
              />
              <p className="text-xs text-muted-foreground mb-4">
                Just a username? We&apos;ll add .bsky.social for you.
              </p>

              {error && (
                <p className="text-sm text-destructive mb-4">{error}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !handle.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? "Connecting..." : "Connect"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
