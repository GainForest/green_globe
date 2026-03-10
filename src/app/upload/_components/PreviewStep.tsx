"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { applyMappings } from "@/lib/upload/column-mapper";
import { parseAndValidateRows } from "@/lib/upload/schemas";
import { TARGET_FIELDS } from "@/lib/upload/types";
import type { ColumnMapping, ValidatedRow } from "@/lib/upload/types";

const MAX_PREVIEW_ROWS = 20;

type PreviewStepProps = {
  parsedData: Record<string, string>[];
  mappings: ColumnMapping[];
  onNext: (validRows: ValidatedRow[]) => void;
  onBack: () => void;
};

/** Get the human-readable label for a target field */
function getFieldLabel(field: string): string {
  return TARGET_FIELDS.find((f) => f.field === field)?.label ?? field;
}

/** Summarise errors: count occurrences of each field path */
function buildErrorSummary(
  errors: { index: number; issues: { path: string; message: string }[] }[]
): { path: string; count: number; message: string }[] {
  const map = new Map<string, { count: number; message: string }>();
  for (const err of errors) {
    for (const issue of err.issues) {
      const existing = map.get(issue.path);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(issue.path, { count: 1, message: issue.message });
      }
    }
  }
  return Array.from(map.entries())
    .map(([path, { count, message }]) => ({ path, count, message }))
    .sort((a, b) => b.count - a.count);
}

export default function PreviewStep({
  parsedData,
  mappings,
  onNext,
  onBack,
}: PreviewStepProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [errorSectionOpen, setErrorSectionOpen] = useState(false);

  // Apply mappings then validate — computed once on mount
  const { validationResult, mappedHeaders } = useMemo(() => {
    const mapped = applyMappings(parsedData, mappings);
    const result = parseAndValidateRows(mapped);
    // Collect the unique target field names that appear in the mapped data
    const headerSet = new Set<string>();
    for (const row of mapped) {
      for (const key of Object.keys(row)) {
        headerSet.add(key);
      }
    }
    return { validationResult: result, mappedHeaders: Array.from(headerSet) };
  }, [parsedData, mappings]);

  const { valid, errors } = validationResult;
  const totalRows = parsedData.length;
  const validCount = valid.length;
  const errorCount = errors.length;

  // Build a lookup: row index -> error issues
  const errorByIndex = useMemo(() => {
    const map = new Map<number, { path: string; message: string }[]>();
    for (const err of errors) {
      map.set(err.index, err.issues);
    }
    return map;
  }, [errors]);

  // Build a lookup: row index -> mapped row data (for display)
  const mappedRows = useMemo(() => applyMappings(parsedData, mappings), [parsedData, mappings]);

  const errorSummary = useMemo(() => buildErrorSummary(errors), [errors]);

  const previewRows = mappedRows.slice(0, MAX_PREVIEW_ROWS);
  const showingNote = totalRows > MAX_PREVIEW_ROWS;

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Summary banner variant
  const allValid = errorCount === 0;
  const allInvalid = validCount === 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Preview &amp; Validate</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review your data before uploading. Errors must be fixed by going back and adjusting column mappings.
        </p>
      </div>

      {/* Summary banner */}
      {allValid ? (
        <div className="flex items-center gap-2 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            All {totalRows} row{totalRows !== 1 ? "s" : ""} are valid and ready to upload.
          </span>
        </div>
      ) : allInvalid ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>No valid rows found. Please go back and fix column mappings.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {validCount} row{validCount !== 1 ? "s" : ""} valid,{" "}
            {errorCount} row{errorCount !== 1 ? "s" : ""} have errors.
          </span>
        </div>
      )}

      {/* Data preview table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">
            Data Preview
          </h3>
          {showingNote && (
            <span className="text-xs text-muted-foreground">
              Showing {MAX_PREVIEW_ROWS} of {totalRows} rows — all valid rows will be uploaded
            </span>
          )}
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground uppercase tracking-wide w-8">
                  #
                </th>
                {mappedHeaders.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-2 text-left font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {getFieldLabel(header)}
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-medium text-muted-foreground uppercase tracking-wide w-16">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {previewRows.map((row, displayIdx) => {
                const rowErrors = errorByIndex.get(displayIdx);
                const hasError = !!rowErrors;
                const isExpanded = expandedRows.has(displayIdx);

                return (
                  <>
                    <tr
                      key={displayIdx}
                      className={`${
                        hasError
                          ? "border-l-2 border-l-destructive bg-destructive/5 cursor-pointer hover:bg-destructive/10"
                          : "hover:bg-muted/20"
                      }`}
                      onClick={hasError ? () => toggleRow(displayIdx) : undefined}
                    >
                      <td className="px-3 py-2 text-muted-foreground font-mono">
                        {displayIdx + 1}
                      </td>
                      {mappedHeaders.map((header) => (
                        <td
                          key={header}
                          className="px-3 py-2 font-mono text-foreground max-w-[160px] truncate"
                        >
                          {row[header] ?? (
                            <span className="text-muted-foreground/50 italic">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        {hasError ? (
                          <div className="flex items-center gap-1 text-destructive">
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 shrink-0" />
                            )}
                          </div>
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </td>
                    </tr>
                    {hasError && isExpanded && (
                      <tr key={`${displayIdx}-errors`} className="bg-destructive/5">
                        <td
                          colSpan={mappedHeaders.length + 2}
                          className="px-4 py-2"
                        >
                          <ul className="space-y-0.5">
                            {rowErrors.map((issue, i) => (
                              <li key={i} className="text-xs text-destructive flex items-start gap-1.5">
                                <span className="font-medium shrink-0">
                                  {getFieldLabel(issue.path)}:
                                </span>
                                <span>{issue.message}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error summary section */}
      {errorCount > 0 && (
        <div className="rounded-lg border border-destructive/30 overflow-hidden">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left hover:bg-muted/30 transition-colors"
            onClick={() => setErrorSectionOpen((v) => !v)}
          >
            <span className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              {errorCount} row{errorCount !== 1 ? "s" : ""} with errors
            </span>
            {errorSectionOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {errorSectionOpen && (
            <div className="border-t border-destructive/20 px-4 py-3 space-y-4">
              {/* Common errors */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Common Issues
                </p>
                <ul className="space-y-1">
                  {errorSummary.map((item) => (
                    <li key={item.path} className="text-sm flex items-start gap-2">
                      <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-destructive/10 text-destructive text-xs font-medium px-1.5 py-0.5 min-w-[1.5rem]">
                        {item.count}
                      </span>
                      <span>
                        <span className="font-medium">{getFieldLabel(item.path)}</span>
                        {" — "}
                        <span className="text-muted-foreground">{item.message}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* All error rows */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Error Rows
                </p>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {errors.map((err) => (
                    <li key={err.index} className="text-xs border border-destructive/20 rounded-md p-2 space-y-0.5">
                      <p className="font-medium text-foreground">Row {err.index + 1}</p>
                      {err.issues.map((issue, i) => (
                        <p key={i} className="text-muted-foreground">
                          <span className="text-destructive font-medium">{getFieldLabel(issue.path)}:</span>{" "}
                          {issue.message}
                        </p>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button variant="outline" onClick={onBack}>
          Back to Column Mapping
        </Button>
        <Button
          onClick={() => onNext(valid)}
          disabled={validCount === 0}
        >
          Upload {validCount} Valid Row{validCount !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
