import type { HyperindexQueryResponse } from "./types";

export const HYPERINDEX_ENDPOINT = "https://api.hi.gainforest.app/graphql";

const MAX_PAGES = 200;

export async function queryHyperindex<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(HYPERINDEX_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Hyperindex query failed: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const result = (await response.json()) as {
    data: T;
    errors?: Array<{ message: string }>;
  };

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }

  return result.data as T;
}

export async function queryAllPages<TNode>(
  query: string,
  variables: Record<string, unknown>,
  connectionPath: string,
): Promise<TNode[]> {
  const nodes: TNode[] = [];
  let currentVariables = { ...variables };
  let pageCount = 0;

  while (true) {
    if (pageCount >= MAX_PAGES) {
      console.warn(
        `[Hyperindex] queryAllPages hit safety limit of ${MAX_PAGES} pages for ${connectionPath}. Returning ${nodes.length} nodes collected so far.`,
      );
      break;
    }

    const data = await queryHyperindex<
      HyperindexQueryResponse<string, TNode>
    >(query, currentVariables);

    const connection = data[connectionPath];

    if (!connection || !connection.edges) {
      break;
    }

    if (connection.edges.length === 0) {
      break;
    }

    for (const edge of connection.edges) {
      nodes.push(edge.node);
    }

    if (!connection.pageInfo.hasNextPage) {
      break;
    }

    // Guard: if endCursor is null/undefined but hasNextPage is true, stop to prevent infinite loop
    if (!connection.pageInfo.endCursor) {
      console.warn(
        `[Hyperindex] hasNextPage is true but endCursor is null for ${connectionPath}. Stopping pagination with ${nodes.length} nodes.`,
      );
      break;
    }

    currentVariables = {
      ...currentVariables,
      after: connection.pageInfo.endCursor,
    };

    pageCount++;
  }

  return nodes;
}
