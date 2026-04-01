/**
 * Standardized React Query key factory for Hyperindex queries.
 *
 * All keys are prefixed with "hi" to distinguish from legacy PDS query keys.
 * This enables easy cache invalidation of all Hyperindex data via
 * `queryClient.invalidateQueries({ queryKey: hiKeys.all })`.
 */
export const hiKeys = {
  all: ["hi"] as const,

  // Organization listing
  organizations: () => ["hi", "organizations"] as const,

  // Per-organization queries (keyed by DID)
  occurrences: (did: string, filters?: Record<string, unknown>) =>
    ["hi", "occurrences", did, filters] as const,
  measurements: (did: string) => ["hi", "measurements", did] as const,
  multimedia: (did: string) => ["hi", "multimedia", did] as const,
  members: (did: string) => ["hi", "members", did] as const,
  layers: (did: string) => ["hi", "layers", did] as const,
  locations: (did: string) => ["hi", "locations", did] as const,
  defaultSite: (did: string) => ["hi", "defaultSite", did] as const,
  donations: (did: string) => ["hi", "donations", did] as const,

  // Collection statistics
  stats: () => ["hi", "stats"] as const,
};
