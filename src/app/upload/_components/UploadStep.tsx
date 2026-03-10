"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useAtprotoStore } from "@/app/_components/stores/atproto";
import SignInBlueskyDialog from "@/app/_components/dialogs/SignInBluesky";
import type { ValidatedRow } from "@/lib/upload/types";
import { writeTreeRecordAction } from "./actions";

type RowStatus =
  | { state: "pending" }
  | { state: "uploading" }
  | { state: "success"; occurrenceUri: string }
  | { state: "error"; error: string };

type UploadProgress = {
  current: number;
  total: number;
  successes: number;
  failures: number;
  currentRow: string;
};

type UploadStepProps = {
  validRows: ValidatedRow[];
  onComplete: () => void;
  onBack: () => void;
};

export default function UploadStep({ validRows, onComplete, onBack }: UploadStepProps) {
  const router = useRouter();
  const auth = useAtprotoStore((state) => state.auth);
  const isReady = useAtprotoStore((state) => state.isReady);

  const [uploadStarted, setUploadStarted] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    current: 0,
    total: validRows.length,
    successes: 0,
    failures: 0,
    currentRow: "",
  });
  const [rowStatuses, setRowStatuses] = useState<RowStatus[]>(
    validRows.map(() => ({ state: "pending" }))
  );
  const [failedRowsOpen, setFailedRowsOpen] = useState(false);

  // Prevent double-run in StrictMode
  const uploadRef = useRef(false);

  const isAuthenticated = auth.authenticated;

  const runUpload = async () => {
    if (uploadRef.current) return;
    uploadRef.current = true;
    setUploadStarted(true);

    let successes = 0;
    let failures = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const speciesName = row.occurrence.scientificName || `Row ${i + 1}`;

      // Mark as uploading
      setRowStatuses((prev) => {
        const next = [...prev];
        next[i] = { state: "uploading" };
        return next;
      });
      setProgress((prev) => ({
        ...prev,
        current: i + 1,
        currentRow: speciesName,
      }));

      const result = await writeTreeRecordAction({
        occurrence: row.occurrence,
        measurements: row.measurements,
      });

      if (result.success) {
        successes += 1;
        setRowStatuses((prev) => {
          const next = [...prev];
          next[i] = { state: "success", occurrenceUri: result.occurrenceUri };
          return next;
        });
      } else {
        failures += 1;
        setRowStatuses((prev) => {
          const next = [...prev];
          next[i] = { state: "error", error: result.error };
          return next;
        });
      }

      setProgress((prev) => ({
        ...prev,
        successes,
        failures,
      }));
    }

    setUploadDone(true);
  };

  // Auto-start upload when component mounts (if authenticated)
  useEffect(() => {
    if (isAuthenticated && !uploadStarted) {
      runUpload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // --- Not signed in ---
  if (!isReady) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Confirm &amp; Upload</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sign in to upload {validRows.length} tree record{validRows.length !== 1 ? "s" : ""} to Green Globe.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>You must be signed in to upload data.</span>
        </div>

        <SignInBlueskyDialog
          trigger={
            <Button>Sign in with ClimateAI</Button>
          }
        />

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button variant="outline" onClick={onBack}>
            Back to Preview
          </Button>
        </div>
      </div>
    );
  }

  // --- Upload in progress or done ---
  const { current, total, successes, failures, currentRow } = progress;
  const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;
  const allSucceeded = uploadDone && failures === 0;
  const someFailed = uploadDone && failures > 0;

  const failedRows = rowStatuses
    .map((status, i) => ({ status, row: validRows[i], index: i }))
    .filter((r) => r.status.state === "error");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Confirm &amp; Upload</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Uploading {total} tree record{total !== 1 ? "s" : ""} to Green Globe.
        </p>
      </div>

      {/* Progress bar */}
      {!uploadDone && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {uploadStarted
                ? `Uploading row ${current} of ${total}${currentRow ? ` — ${currentRow}` : ""}…`
                : "Preparing upload…"}
            </span>
            <span className="text-muted-foreground font-mono">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {successes} succeeded, {failures} failed
          </p>
        </div>
      )}

      {/* Completion banner */}
      {uploadDone && allSucceeded && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Successfully uploaded {successes} tree record{successes !== 1 ? "s" : ""} to Green Globe.
          </span>
        </div>
      )}
      {uploadDone && someFailed && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {successes} record{successes !== 1 ? "s" : ""} uploaded, {failures} failed.
          </span>
        </div>
      )}

      {/* Per-row status list */}
      <div className="rounded-lg border overflow-hidden">
        <div className="max-h-64 overflow-y-auto divide-y divide-border">
          {validRows.map((row, i) => {
            const status = rowStatuses[i];
            const species = row.occurrence.scientificName || `Row ${i + 1}`;
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground w-6 shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{species}</span>
                <span className="shrink-0">
                  {status.state === "pending" && (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  )}
                  {status.state === "uploading" && (
                    <span className="text-xs text-muted-foreground animate-pulse">Uploading…</span>
                  )}
                  {status.state === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {status.state === "error" && (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failed rows detail */}
      {failedRows.length > 0 && (
        <div className="rounded-lg border border-destructive/30 overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left hover:bg-muted/30 transition-colors"
            onClick={() => setFailedRowsOpen((v) => !v)}
          >
            <span className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              {failures} row{failures !== 1 ? "s" : ""} failed
            </span>
            {failedRowsOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {failedRowsOpen && (
            <div className="border-t border-destructive/20 px-4 py-3">
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {failedRows.map(({ status, row, index }) => (
                  <li
                    key={index}
                    className="text-xs border border-destructive/20 rounded-md p-2 space-y-0.5"
                  >
                    <p className="font-medium text-foreground">
                      Row {index + 1} — {row.occurrence.scientificName || "(no species)"}
                    </p>
                    <p className="text-destructive">
                      {status.state === "error" ? status.error : "Unknown error"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={uploadStarted && !uploadDone}
        >
          Back to Preview
        </Button>

        {uploadDone && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={onComplete}>
              Upload More Data
            </Button>
            <Button onClick={() => router.push("/")}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
