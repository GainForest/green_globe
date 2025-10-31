"use server";

export type CreateInviteCodesParams = {
  codeCount: number;
  useCount: number;
};

export type InviteCodeResult = {
  account: string;
  codes: string[];
};

export type CreateInviteCodesResponse = {
  codes: InviteCodeResult[];
};

/**
 * Creates invite codes via the AT Protocol PDS server using HTTP Basic Auth
 * @param params - The parameters for creating invite codes
 * @returns The created invite codes organized by account
 */
export const createInviteCodes = async (
  params: CreateInviteCodesParams
): Promise<CreateInviteCodesResponse> => {
  const { codeCount, useCount } = params;

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

  const data = await response.json();

  return {
    codes: data.codes,
  };
};
