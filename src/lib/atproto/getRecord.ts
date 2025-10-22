import { ValidationResult } from "@atproto/lexicon";
import ClimateAIAgent from "./agent";

const getRecord = async <V>(
  did: string,
  collection: string,
  rkey: string,
  validationFn?: (v: V) => ValidationResult<V>
) => {
  const data = await ClimateAIAgent.com.atproto.repo.getRecord({
    repo: did,
    collection: collection,
    rkey: rkey,
  });
  if (!data.success) throw new Error("Failed to fetch record");
  if (!validationFn) return data.data.value as V;
  const validation = validationFn(data.data.value as V);
  console.log("validation", validation);
  if (!validation.success)
    throw new Error(
      "Record fetched but validation failed: " + validation.error.message
    );
  return validation.value;
};

export default getRecord;
