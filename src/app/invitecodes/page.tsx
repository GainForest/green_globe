"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, AlertCircle, Loader2, Lock } from "lucide-react";

interface InviteCodeResult {
  account: string;
  codes: string[];
}

interface CreateInviteCodesResponse {
  success: boolean;
  codes: InviteCodeResult[];
  metadata: {
    codeCount: number;
    useCount: number;
    totalCodes: number;
    generatedAt: string;
  };
  error?: string;
  message?: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [codeCount, setCodeCount] = useState(1);
  const [useCount, setUseCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CreateInviteCodesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codeCount,
          useCount,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || "Failed to generate invite codes");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingPassword(true);
    setPasswordError("");

    try {
      const response = await fetch("/api/verify-invite-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setPasswordError("Invalid password");
      }
    } catch {
      setPasswordError("Error verifying password");
    } finally {
      setIsCheckingPassword(false);
    }
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Access Required
            </CardTitle>
            <CardDescription>
              Enter the password to access the invite code generator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isCheckingPassword}
              >
                {isCheckingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Access Invite Generator"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate New Codes</CardTitle>
          <CardDescription>
            Configure the number of codes and how many times each can be used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codeCount">Number of Codes</Label>
              <Input
                id="codeCount"
                type="number"
                min="1"
                max="100"
                value={codeCount}
                onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">
                Between 1 and 100 codes
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="useCount">Uses per Code</Label>
              <Input
                id="useCount"
                type="number"
                min="1"
                max="1000"
                value={useCount}
                onChange={(e) => setUseCount(parseInt(e.target.value) || 10)}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">
                Between 1 and 1000 uses per code
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Invite Codes"
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Invite Codes</CardTitle>
            <CardDescription>
              {result.metadata.totalCodes} codes generated on{" "}
              {new Date(result.metadata.generatedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {result.codes.map((accountResult, accountIndex) => (
                <div key={accountIndex} className="space-y-2">
                  <h4 className="font-medium">Account: {accountResult.account}</h4>
                  <div className="grid gap-2">
                    {accountResult.codes.map((code, codeIndex) => (
                      <div
                        key={codeIndex}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <code className="font-mono text-sm">{code}</code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(code)}
                        >
                          {copiedCode === code ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-medium">Total Codes</p>
                  <p className="text-muted-foreground">{result.metadata.totalCodes}</p>
                </div>
                <div>
                  <p className="font-medium">Uses per Code</p>
                  <p className="text-muted-foreground">{result.metadata.useCount}</p>
                </div>
                <div>
                  <p className="font-medium">Total Uses</p>
                  <p className="text-muted-foreground">
                    {result.metadata.totalCodes * result.metadata.useCount}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Generated</p>
                  <p className="text-muted-foreground">
                    {new Date(result.metadata.generatedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
