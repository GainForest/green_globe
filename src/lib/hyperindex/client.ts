import { GraphQLClient } from "graphql-request";
import { HYPERINDEX_ENDPOINT } from "@/config/hyperindex";

/**
 * Shared Hyperindex GraphQL client singleton.
 *
 * Used for all read-path AT Protocol data fetching. The Hyperindex API is
 * read-only (no mutations) — write operations still go through the PDS.
 */
export const hyperindexClient = new GraphQLClient(HYPERINDEX_ENDPOINT);
