import { easGraphqlFetch, graphql } from ".";
import tryCatch from "@/lib/try-catch";
import { EcocertAttestation } from "../types";

const EcocertsByProjectQuery = graphql(`
  query GetEcocertsInProject($projectId: String!) {
    ecocerts(project_id: $projectId) {
      attestation_id
      attester
      ecocert_id
      project_id
      timestamp
    }
  }
`);

export const fetchEcocertsByProject = async (
  projectId: string
): Promise<EcocertAttestation[] | null> => {
  const [result, error] = await tryCatch(async () =>
    easGraphqlFetch(EcocertsByProjectQuery, {
      projectId,
    })
  );
  if (error) {
    console.error(
      "Ecocerts by project id",
      projectId,
      "could not be fetched.",
      error
    );
    return null;
  }
  if (result === null || result.ecocerts === null) return [];
  return result.ecocerts.map((ecocert) => ({
    attestationId: ecocert.attestation_id,
    attester: ecocert.attester,
    ecocertId: ecocert.ecocert_id,
    projectId: ecocert.project_id,
    timestamp: ecocert.timestamp,
  }));
};
