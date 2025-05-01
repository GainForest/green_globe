/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
    'BigInt': unknown;
    'Boolean': unknown;
    'Byte': unknown;
    'Date': unknown;
    'DateTime': unknown;
    'EcocertsInProject': { kind: 'OBJECT'; name: 'EcocertsInProject'; fields: { 'attestation_id': { name: 'attestation_id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'attester': { name: 'attester'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'ecocert_id': { name: 'ecocert_id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'id': { name: 'id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'BigInt'; ofType: null; }; } }; 'project_id': { name: 'project_id'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'timestamp': { name: 'timestamp'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; }; };
    'File': unknown;
    'Int': unknown;
    'JSON': unknown;
    'JSONObject': unknown;
    'Query': { kind: 'OBJECT'; name: 'Query'; fields: { 'ecocerts': { name: 'ecocerts'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'EcocertsInProject'; ofType: null; }; }; }; } }; 'redwood': { name: 'redwood'; type: { kind: 'OBJECT'; name: 'Redwood'; ofType: null; } }; }; };
    'Redwood': { kind: 'OBJECT'; name: 'Redwood'; fields: { 'currentUser': { name: 'currentUser'; type: { kind: 'SCALAR'; name: 'JSON'; ofType: null; } }; 'prismaVersion': { name: 'prismaVersion'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'version': { name: 'version'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; }; };
    'String': unknown;
    'Time': unknown;
};

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
  name: 'eas';
  query: 'Query';
  mutation: never;
  subscription: never;
  types: introspection_types;
};

import * as gqlTada from 'gql.tada';
