import type { HyperindexQueryResponse } from "./types";

export const HYPERINDEX_ENDPOINT = "https://api.hi.gainforest.app/graphql";

export async function queryHyperindex<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(HYPERINDEX_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

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

  while (true) {
    const data = await queryHyperindex<
      HyperindexQueryResponse<string, TNode>
    >(query, currentVariables);

    const connection = data[connectionPath];

    for (const edge of connection.edges) {
      nodes.push(edge.node);
    }

    if (!connection.pageInfo.hasNextPage) {
      break;
    }

    currentVariables = {
      ...currentVariables,
      after: connection.pageInfo.endCursor,
    };
  }

  return nodes;
}
