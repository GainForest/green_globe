const ATTESTATION_TYPE_TO_SCHEMA = {
  ecocert: {
    schema: "string project_id,string ecocert_id" as const,
  },
};

type AttestationType = keyof typeof ATTESTATION_TYPE_TO_SCHEMA;

const attachSchemaUID = (
  attestationType: AttestationType,
  schemaUID: string
) => {
  return {
    ...ATTESTATION_TYPE_TO_SCHEMA[attestationType],
    schemaUID,
  };
};

export type EASSchemaConfig = {
  schema: string;
  schemaUID: string;
  attestationType: AttestationType;
};
export type EASConfig = {
  chainId: number;
  explorerUrl: string;
  graphqlUrl: string;
  easContractAddress: string;
  schemas: readonly EASSchemaConfig[];
};
export const EAS_CONFIGS = [
  {
    chainId: 42220, // Celo
    explorerUrl: "https://celo.easscan.org",
    graphqlUrl: "https://celo.easscan.org/graphql",
    easContractAddress: "0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92",
    schemas: [
      {
        attestationType: "ecocert",
        ...attachSchemaUID(
          "ecocert",
          "0xaf2fa65fba689bf83d86673d4616f434242e3f739da859df0a0f79179a838615"
        ),
      },
    ],
  },
] as const;

export const getEASConfig = (chainId: number) => {
  return EAS_CONFIGS.find((config) => config.chainId === chainId);
};
