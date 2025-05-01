import { initGraphQLTada } from "gql.tada";
import type { introspection } from "../hypercerts-env.d";
import { TadaDocumentNode } from "gql.tada";
import { graphqlFetch } from "@/graphql";

export const graphql = initGraphQLTada<{
  introspection: introspection;
}>();

export const hypercertsGraphqlFetch = <ResponseType, VariablesType>(
  query: TadaDocumentNode<ResponseType, VariablesType, unknown>,
  variables?: VariablesType
) =>
  graphqlFetch<ResponseType, VariablesType>(
    "https://api.hypercerts.org/v1/graphql",
    query,
    variables
  );
