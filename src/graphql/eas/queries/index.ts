import { initGraphQLTada, TadaDocumentNode } from "gql.tada";
import type { introspection } from "../eas-env.d";
import { graphqlFetch } from "@/graphql";

export const graphql = initGraphQLTada<{
  introspection: introspection;
}>();

export const easGraphqlFetch = <ResponseType, VariablesType>(
  query: TadaDocumentNode<ResponseType, VariablesType, unknown>,
  variables?: VariablesType
) =>
  graphqlFetch<ResponseType, VariablesType>(
    "https://eas-graphql.vercel.app/api/graphql",
    query,
    variables
  );
