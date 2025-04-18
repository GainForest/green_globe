import { EASConfig } from "@/config/eas";
import { EcocertAttestationData } from "./hook";
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import type { JsonRpcSigner } from "ethers";

const createEcocertAttestation = (
  signer: JsonRpcSigner,
  attestationData: EcocertAttestationData,
  easConfig: EASConfig
) => {
  const { easContractAddress, schemas } = easConfig;
  const schema = schemas.find((schema) => schema.attestationType === "ecocert");
  if (!schema) {
    throw new Error("unsupported-chain");
  }
  if (!signer) {
    throw new Error("signer-not-found");
  }
  const eas = new EAS(easContractAddress);
  eas.connect(signer);

  const schemaEncoder = new SchemaEncoder(schema.schema);

  const encodedData = schemaEncoder.encodeData([
    { name: "project_id", value: attestationData.project_id, type: "string" },
    { name: "ecocert_id", value: attestationData.ecocert_id, type: "string" },
  ]);

  return eas.attest({
    schema: schema.schemaUID,
    data: {
      recipient: "0x0000000000000000000000000000000000000000",
      expirationTime: BigInt(0),
      revocable: false, // Be aware that if your schema is not revocable, this MUST be false
      data: encodedData,
      refUID:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
  });
};

export { createEcocertAttestation };
