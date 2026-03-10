"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, FileText, AlertCircle } from "lucide-react";
import { useCsvParser } from "@/lib/upload/use-csv-parser";
import { detectKoboFormat } from "@/lib/upload/kobo-mapper";
import { autoDetectMappings } from "@/lib/upload/column-mapper";
import type { ColumnMapping } from "@/lib/upload/types";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

type FileDropStepProps = {
  onFileAndMappings: (
    file: File,
    parsedData: Record<string, string>[],
    headers: string[],
    mappings: ColumnMapping[]
  ) => void;
  onNext: () => void;
};

export default function FileDropStep({
  onFileAndMappings,
  onNext,
}: FileDropStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { parseFile, parsedData, headers, rowCount, error, isParsing, reset } =
    useCsvParser();

  const processFile = useCallback(
    async (file: File) => {
      setFileSizeError(null);
      setSelectedFile(null);
      reset();

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileSizeError(
          `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`
        );
        return;
      }

      setSelectedFile(file);
      await parseFile(file);
    },
    [parseFile, reset]
  );

  // After parsing completes, detect format and compute mappings
  const handleContinue = useCallback(() => {
    if (!parsedData || !headers) return;

    const koboResult = detectKoboFormat(headers);
    const mappings = koboResult.isKobo
      ? koboResult.mappings
      : autoDetectMappings(headers);

    onFileAndMappings(selectedFile!, parsedData, headers, mappings);
    onNext();
  }, [parsedData, headers, selectedFile, onFileAndMappings, onNext]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const isParsed = parsedData !== null && !isParsing && !error;
  const displayError = fileSizeError ?? error;

  // Detect format for display when already parsed
  const formatBadge = (() => {
    if (!isParsed || !headers) return null;
    const koboResult = detectKoboFormat(headers);
    return koboResult.isKobo ? "kobo" : "generic";
  })();

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv"
        className="hidden"
        onChange={handleFileInputChange}
        aria-label="Upload CSV or TSV file"
      />

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center gap-3
          rounded-lg border-2 border-dashed p-10 text-center
          transition-colors cursor-pointer
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }
        `}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleBrowseClick();
        }}
        aria-label="Drop CSV or TSV file here or click to browse"
      >
        {isParsing ? (
          <>
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Parsing file…</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drag &amp; drop a CSV or TSV file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse — max 10 MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
            >
              Browse files
            </Button>
          </>
        )}
      </div>

      {/* Error state */}
      {displayError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Parsed summary card */}
      {isParsed && selectedFile && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {rowCount.toLocaleString()} row{rowCount !== 1 ? "s" : ""} ·{" "}
                {headers?.length ?? 0} column
                {(headers?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            {formatBadge === "kobo" ? (
              <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                KoboToolbox format detected
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Generic CSV
              </span>
            )}
          </div>
        </div>
      )}

      {/* Continue button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleContinue}
          disabled={!isParsed || isParsing}
        >
          Continue to Column Mapping
        </Button>
      </div>
    </div>
  );
}
