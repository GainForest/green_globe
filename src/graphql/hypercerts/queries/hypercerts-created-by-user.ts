import { graphql, hypercertsGraphqlFetch } from ".";
import tryCatch from "@/lib/try-catch";
import { Hypercert } from "@/graphql/hypercerts/types";

const HypercertsCreatedByUserQuery = graphql(`
  query HypercertsCreatedByUser($userAddress: String!) {
    hypercerts(where: { creator_address: { eq: $userAddress } }) {
      data {
        hypercert_id
        creator_address
        units
        uri
        creation_block_timestamp
        metadata {
          name
          description
          contributors
          work_scope
          work_timeframe_from
          work_timeframe_to
        }
      }
    }
  }
`);

export const fetchHypercertsCreatedByUser = async (
  userId: `0x${string}`
): Promise<Hypercert[] | null> => {
  const [result, error] = await tryCatch(async () =>
    hypercertsGraphqlFetch(HypercertsCreatedByUserQuery, {
      userAddress: userId.toLowerCase(),
    })
  );
  if (error) {
    console.error(
      "Hypercerts by Creator ID",
      userId,
      "could not be fetched.",
      error
    );
    return null;
  }

  const hypercerts = result.hypercerts.data;
  if (hypercerts === null) return [];

  return hypercerts.map((hypercert) => {
    const toReturn = {
      hypercertId: hypercert.hypercert_id as string,
      creatorAddress: hypercert.creator_address as string,
      units: hypercert.units as string,
      uri: hypercert.uri as string,
      creationBlockTimestamp: hypercert.creation_block_timestamp as string,
      metadata:
        hypercert.metadata === null
          ? null
          : {
              name: hypercert.metadata.name ?? "Untitled",
              description:
                hypercert.metadata.description ?? "No description found.",
              contributors: hypercert.metadata.contributors ?? [],
              work:
                hypercert.metadata.work_scope === null
                  ? null
                  : {
                      scope: hypercert.metadata.work_scope,
                      from: hypercert.metadata.work_timeframe_from as string,
                      to: hypercert.metadata.work_timeframe_to as string,
                    },
            },
    } satisfies Hypercert;

    return toReturn;
  });
};
