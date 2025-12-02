import { DidDocument, IdResolver } from "@atproto/identity";

export const getDidDoc = async (did: string): Promise<DidDocument | null> => {
  const resolver = new IdResolver();
  const didDoc = await resolver.did.resolve(did);

  if (!didDoc) return null;

  return didDoc;
};
