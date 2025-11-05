import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    const correctPassword = process.env.INVITE_CODES_PASSWORD;
    
    if (!correctPassword) {
      return NextResponse.json(
        { success: false, error: "Password not configured" },
        { status: 500 }
      );
    }
    
    if (password === correctPassword) {
      const basicAuth = Buffer.from(`captainfatin:${password}`).toString(
        "base64"
      );
      const cookieStore = await cookies()
      cookieStore.set({
        name: 'admin_token',
        value: basicAuth,
        httpOnly:true,
        path: '/',
      })
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
