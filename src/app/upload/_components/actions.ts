"use server";

import { Agent } from "@atproto/api";
import { getAtprotoSDK } from "@/lib/atproto/sdk";
import { getAppSession } from "gainforest-sdk/oauth";
import { writeTreeRecord } from "@/lib/upload/pds-writer";
import type { OccurrenceInput, MeasurementInput } from "@/lib/upload/types";

/**
 * Server action: write a single tree record (occurrence + measurements) to the PDS.
 *
 * Restores the authenticated OAuth session from the server-side cookie and
 * delegates to writeTreeRecord. Returns a serialisable result so it can be
 * called from a client component.
 */
export async function writeTreeRecordAction(row: {
  occurrence: OccurrenceInput;
  measurements: MeasurementInput[];
}): Promise<
  | { success: true; occurrenceUri: string; measurementUris: string[] }
  | { success: false; error: string }
> {
  try {
    const session = await getAppSession();

    if (!session.isLoggedIn || !session.did) {
      return { success: false, error: "Not authenticated" };
    }

    const oauthSession = await getAtprotoSDK().restoreSession(session.did);
    if (!oauthSession) {
      return { success: false, error: "Session expired — please sign in again" };
    }

    const agent = new Agent(oauthSession);
    const result = await writeTreeRecord(agent, session.did, row);

    return { success: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
