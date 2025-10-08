"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAtproto } from "@/app/_components/Providers/atproto-provider";

const CallbackPage = () => {
  const router = useRouter();
  const { isInitialized, isAuthenticated, error, refreshSession } = useAtproto();
  const [csrfError, setCsrfError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        setCsrfError(`OAuth error: ${error}`);
        return;
      }

      if (state) {
        if (state.length < 10 || !/^[a-zA-Z0-9_-]+$/.test(state)) {
          setCsrfError('Invalid state parameter format - possible security issue');
          return;
        }
      }

      const allParams = Array.from(params.entries());
      const suspiciousParams = allParams.filter(([key, value]) => {
        // Check for common XSS/injection attempts
        return value.includes('<script') || 
               value.includes('javascript:') || 
               value.includes('data:text/html') ||
               key.includes('<') || key.includes('>');
      });
      
      if (suspiciousParams.length > 0) {
        setCsrfError('Suspicious parameters detected - possible security attack');
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated && !csrfError) {
      router.replace("/");
    }
  }, [isInitialized, isAuthenticated, router, csrfError]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          <p className="text-sm text-gray-500">Completing sign-in…</p>
        </div>
      </div>
    );
  }

  if (error || csrfError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Authentication failed</h1>
          <p className="mt-2 text-sm text-gray-600">
            {csrfError || error || "We couldn't complete your sign-in. Please try again."}
          </p>
          <div className="mt-4 flex gap-2">
            {!csrfError && (
              <Button variant="default" onClick={() => refreshSession()}>Try again</Button>
            )}
            <Button variant="outline" onClick={() => router.replace("/")}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
        <p className="text-sm text-gray-500">Waiting for authorization…</p>
      </div>
    </div>
  );
};

export default CallbackPage;
