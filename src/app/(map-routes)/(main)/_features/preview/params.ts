import type { PreviewMode } from "./store";

const PREVIEW_MODES: readonly PreviewMode[] = ["all", "only", "none"];

export function normalizePreviewDatasetRefs(values: readonly string[]): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    for (const rawRef of value.split(",")) {
      const ref = rawRef.trim();
      if (!ref || seen.has(ref)) {
        continue;
      }

      seen.add(ref);
      refs.push(ref);
    }
  }

  return refs;
}

export function parsePreviewMode(value: string | null | undefined): PreviewMode | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return PREVIEW_MODES.includes(normalized as PreviewMode)
    ? (normalized as PreviewMode)
    : null;
}

export function resolvePreviewMode(args: {
  explicitMode: string | null | undefined;
  datasetRefs: readonly string[];
}): PreviewMode {
  const explicitMode = parsePreviewMode(args.explicitMode);
  if (explicitMode) {
    return explicitMode;
  }

  return args.datasetRefs.length > 0 ? "only" : "all";
}

export function previewDatasetRefsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}
