/**
 * Hyperindex — GainForest's AT Protocol AppView server.
 *
 * Indexes Lexicon-defined records from the AT Protocol network and exposes
 * them via a dynamically-generated GraphQL API. Used as the primary read-path
 * for AT Protocol data in this app (faster than direct PDS listRecords).
 *
 * @see https://hi.gainforest.app/docs/agents — Full API documentation
 * @see https://api.hi.gainforest.app/graphiql  — Interactive explorer
 */

export const HYPERINDEX_ENDPOINT = "https://api.hi.gainforest.app/graphql";
