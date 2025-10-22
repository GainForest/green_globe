import { PDS_ENDPOINT } from "@/config/atproto";
import { CID } from "multiformats/cid";

const getBlobUrl = (did: string, cid: string | CID) => {
  return `${PDS_ENDPOINT}/xrpc/com.atProto.sync.getBlob?did=${did}&cid=${cid}`;
};

export default getBlobUrl;
