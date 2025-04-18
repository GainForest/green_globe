import React, { useEffect, useState } from "react";
import useEcocertAttestationCreation from "./hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeftRightIcon,
  Check,
  CheckCircle,
  Copy,
  Loader2,
  XCircle,
} from "lucide-react";
import useProjectOverlayStore from "../../ProjectOverlay/store";
import { useAppKitNetwork } from "@reown/appkit/react";
import { getEASConfig } from "@/config/eas";
import Link from "next/link";
import WalletButton from "@/app/_components/WalletButton";

const EcocertAttestationCreation = () => {
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const {
    attestationData,
    creationStatus,
    setAttestationData,
    startAttestationCreation,
    stopAttestationCreation,
    reset,
  } = useEcocertAttestationCreation();
  const { chainId } = useAppKitNetwork();
  const easConfig = chainId ? getEASConfig(Number(chainId)) : undefined;

  const [copiedAttestationUid, setCopiedAttestationUid] = useState(false);
  const copyAttestationUid = () => {
    if (creationStatus.status === "success") {
      if (copiedAttestationUid) return;
      navigator.clipboard.writeText(creationStatus.data.attestationUid);
      setCopiedAttestationUid(true);
      setTimeout(() => {
        setCopiedAttestationUid(false);
      }, 2000);
    }
  };

  useEffect(() => {
    reset();
    if (projectId) {
      setAttestationData({
        project_id: projectId,
        ecocert_id: attestationData?.ecocert_id || "",
      });
    }
  }, [projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startAttestationCreation();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (projectId) {
      setAttestationData({
        project_id: projectId,
        ecocert_id: value,
      });
    }
  };

  if (!projectId) {
    return (
      <div className="p-4 text-center text-gray-500">No project selected</div>
    );
  }

  return (
    <div className="p-4">
      {creationStatus.status === "idle" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ecocert_id">Ecocert ID</Label>
            <Input
              id="ecocert_id"
              name="ecocert_id"
              className="bg-background/50"
              value={attestationData?.ecocert_id || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Attest Ecocert
          </Button>
        </form>
      )}

      {creationStatus.status === "loading" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-center text-balance px-4">
            {creationStatus.message}
          </p>
          <Button variant="outline" onClick={() => stopAttestationCreation()}>
            Cancel
          </Button>
        </div>
      )}

      {creationStatus.status === "success" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-foreground/10 p-3">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <p className="text-center text-balance px-4">
            {creationStatus.message}
          </p>
          <div className="flex flex-col w-full px-2">
            <span className="font-bold text-sm text-muted-foreground">
              Attestation UID
            </span>
            <div className="flex items-center border border-border rounded-md p-1 bg-background/20">
              <input
                type="text"
                value={creationStatus.data.attestationUid}
                className="w-full rounded-md border-none bg-transparent text-sm font-mono px-2 truncate"
                readOnly
                disabled
              />
              <Button
                variant="outline"
                onClick={copyAttestationUid}
                disabled={copiedAttestationUid}
              >
                {copiedAttestationUid ? <Check /> : <Copy />}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {easConfig && (
              <Link
                href={`${easConfig.explorerUrl}/attestation/view/${creationStatus.data.attestationUid}`}
                target="_blank"
              >
                <Button variant="outline">View on EASScan</Button>
              </Link>
            )}
            <Button onClick={() => reset()}>Create Another</Button>
          </div>
        </div>
      )}

      {creationStatus.status === "error" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-foreground/10 p-3">
            <XCircle size={24} className="text-red-600 dark:text-red-300" />
          </div>
          <p className="text-center text-balance px-4">
            {creationStatus.message}
          </p>
          {creationStatus.type === "wallet-not-connected" && <WalletButton />}
          {creationStatus.type === "chain-not-supported" && (
            <Button>
              <ArrowLeftRightIcon size={16} />
              Switch Chain
            </Button>
          )}
          <Button variant="outline" onClick={() => reset()}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default EcocertAttestationCreation;
