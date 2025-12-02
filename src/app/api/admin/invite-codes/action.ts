"use server";
import { cookies } from "next/headers";
import postgres from "postgres";

if (!process.env.POSTGRES_URL_NON_POOLING_ATPROTO_AUTH_MAPPING) {
  throw new Error(
    "Missing POSTGRES_URL_NON_POOLING_ATPROTO_AUTH_MAPPING env var"
  );
}
const sql = postgres(
  process.env.POSTGRES_URL_NON_POOLING_ATPROTO_AUTH_MAPPING,
  { ssl: "require" }
);

export type CreateInviteCodesParams = {
  codeCount: number;
  useCount: number;
  email: string;
};
export type InviteCodeResult = {
  account: string;
  codes: string[];
};

export type InviteCodesResponse = {
  codes: InviteCodeResult[];
};

export type CreateInviteCodesResponse = {
  codes: InviteCodeResult[];
  codeCount: number;
  useCount: number;
  email: string;
};

const verifyAdmin = async () => {
  const cookieStore = await cookies();
  const basicAuth = Buffer.from(
    `captainfatin:${process.env.INVITE_CODES_PASSWORD}`
  ).toString("base64");
  const isAdmin = cookieStore.get("admin_token")?.value === basicAuth;
  return isAdmin;
};

/**
 * Creates invite codes via the AT Protocol PDS server using HTTP Basic Auth
 * @param params - The parameters for creating invite codes
 * @returns The created invite codes organized by account
 */
export const createInviteCodes = async (
  params: CreateInviteCodesParams
): Promise<CreateInviteCodesResponse> => {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    throw new Error(
      "Unauthorized: Invalid credentials. Get correct credentials to access this."
    );
  }
  const { codeCount, useCount, email } = params;

  if (Number(codeCount) <= 0 || Number(useCount) <= 0) {
    throw new Error("codeCount and useCount must be positive integers.");
  }
  if (Number(codeCount) > 100) {
    throw new Error("codeCount cannot exceed 100.");
  }
  if (Number(useCount) > 10) {
    throw new Error("useCount cannot exceed 10.");
  }

  // Get credentials from environment
  const service =
    process.env.NEXT_PUBLIC_ATPROTO_SERVICE_URL || "https://climateai.org";
  const adminUsername = process.env.PDS_ADMIN_IDENTIFIER;
  const adminPassword = process.env.PDS_ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    throw new Error(
      "PDS admin credentials not configured. Please set PDS_ADMIN_IDENTIFIER and PDS_ADMIN_PASSWORD in .env"
    );
  }

  // Create Basic Auth header
  const basicAuth = Buffer.from(`${adminUsername}:${adminPassword}`).toString(
    "base64"
  );

  // Make direct XRPC call with HTTP Basic Auth (same as original curl command)
  const response = await fetch(
    `${service}/xrpc/com.atproto.server.createInviteCodes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        codeCount,
        useCount,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create invite codes: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data: InviteCodesResponse = await response.json();
  const code = data.codes?.[0]?.codes?.[0];
  if (!code) {
    throw new Error("No invite codes returned from PDS server.");
  }
  await sql`INSERT INTO invites(invite_token,email) VALUES (${code}, ${email}) RETURNING *`;
  return {
    codes: data.codes,
    codeCount: Number(codeCount),
    useCount: Number(useCount),
    email,
  };
};
