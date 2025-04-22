import { graphql, ResultOf } from "gql.tada";

const EcocertsByProjectQuery = graphql(`
  query GetEcocertsInProject($id: BigInt!) {
    ecocertsInProject(id: $id) {
      attestation_id
      attester
      ecocert_id
      id
      project_id
      timestamp
    }
  }
`);

type EcocertsByProjectQueryResponse = ResultOf<typeof EcocertsByProjectQuery>;
