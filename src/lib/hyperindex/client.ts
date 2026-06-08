import {
  GraphQLClient,
  type RequestDocument,
  type RequestOptions,
  type Variables,
} from "graphql-request";
import { HYPERINDEX_ENDPOINT } from "@/config/hyperindex";

/**
 * Shared Hyperindex GraphQL client singleton.
 *
 * Used for all read-path AT Protocol data fetching. The Hyperindex API is
 * read-only (no mutations) — write operations still go through the PDS.
 */
export const hyperindexClient = new GraphQLClient(HYPERINDEX_ENDPOINT);

const DEFAULT_RETRY_COUNT = 4;
const RETRY_BASE_DELAY_MS = 150;

type HyperindexRetryOptions = {
  retries?: number;
  label?: string;
};

const getErrorStatus = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null) return null;
  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === "number" ? response.status : null;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const isRetryableHyperindexError = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error);

  return (
    status === 429 ||
    (status !== null && status >= 500) ||
    message.includes("Invalid request body") ||
    message.includes("Failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("ECONNRESET")
  );
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Hyperindex occasionally returns transient plain-text `400 Invalid request body`
 * responses for otherwise-valid paginated GraphQL reads. Retry only transport-
 * shaped failures so schema/query errors still surface immediately.
 */
export const requestHyperindex = async <
  TResponse,
  TVariables extends Variables = Variables,
>(
  document: RequestDocument,
  variables?: TVariables,
  options: HyperindexRetryOptions = {},
): Promise<TResponse> => {
  const retries = options.retries ?? DEFAULT_RETRY_COUNT;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const requestOptions = {
        document,
        ...(variables === undefined ? {} : { variables }),
      } as unknown as RequestOptions<TVariables, TResponse>;

      return await hyperindexClient.request<TResponse, TVariables>(
        requestOptions,
      );
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !isRetryableHyperindexError(error)) {
        throw error;
      }

      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[GG] retrying Hyperindex request${options.label ? ` (${options.label})` : ""}`,
          {
            attempt: attempt + 1,
            retries,
            delay,
            status: getErrorStatus(error),
            message: getErrorMessage(error),
          },
        );
      }
      await wait(delay);
    }
  }

  throw lastError;
};
