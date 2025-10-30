import { NextRequest, NextResponse } from "next/server";
import { createInviteCodes, type CreateInviteCodesParams } from "./action";
import postgres from 'postgres';

if (!process.env.POSTGRES_URL_NON_POOLING_ATPROTO_AUTH_MAPPING) {
  throw new Error("Missing POSTGRES_URL_NON_POOLING_ATPROTO_AUTH_MAPPING env var");
}
const sql = postgres(process.env.POSTGRES_URL_NON_POOLING_ATPROTO_AUTH_MAPPING, { ssl: 'require' });

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/invite-codes
 *
 * Creates invite codes for new users via the AT Protocol PDS server.
 *
 * Request Body:
 * {
 *   "codeCount": number,  // Number of invite codes to create (default: 1)
 *   "useCount": number    // Number of times each code can be used (default: 10)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "codes": [
 *     {
 *       "account": "did:plc:...",
 *       "codes": ["invite-code-1", "invite-code-2", ...]
 *     }
 *   ],
 *   "metadata": {
 *     "codeCount": number,
 *     "useCount": number,
 *     "totalCodes": number
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { codeCount = 1, useCount = 10, email } = body;

    // Validate parameters
    if (
      typeof codeCount !== "number" ||
      codeCount < 1 ||
      codeCount > 100 ||
      !Number.isInteger(codeCount)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid codeCount",
          message:
            "codeCount must be an integer between 1 and 100 (inclusive)",
        },
        { status: 400 }
      );
    }

    if (
      typeof useCount !== "number" ||
      useCount < 1 ||
      useCount > 1000 ||
      !Number.isInteger(useCount)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid useCount",
          message:
            "useCount must be an integer between 1 and 1000 (inclusive)",
        },
        { status: 400 }
      );
    }

    // Create invite codes
    const params: CreateInviteCodesParams = {
      codeCount,
      useCount,
    };

    const result = await createInviteCodes(params);

    // Calculate total codes generated
    const totalCodes = result.codes.reduce(
      (sum, acct) => sum + acct.codes.length,
      0
    );
    const code = result.codes[0]?.codes[0]
    await sql`INSERT INTO invites(invite_token,email) VALUES (${code}, ${email}) RETURNING *`;

    // Return success response
    return NextResponse.json(
      {
        success: true,
        codes: result.codes,
        metadata: {
          codeCount,
          useCount,
          totalCodes,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating invite codes:", error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
