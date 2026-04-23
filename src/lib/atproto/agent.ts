import { PDS_ENDPOINT } from "@/config/atproto";
import { Agent } from "@atproto/api";

const ClimateAIAgent = new Agent(PDS_ENDPOINT);

export default ClimateAIAgent;
