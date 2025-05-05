import { EcocertAttestation } from "@/graphql/eas/types";
import { Hypercert } from "@/graphql/hypercerts/types";
import { AsyncData } from "@/lib/types";

export type ProjectEcocert = EcocertAttestation & {
  asyncEcocert: AsyncData<Hypercert>;
};
