import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const raw =
    cookieStore.get("__Secure-better-auth.session_token")?.value ??
    cookieStore.get("better-auth.session_token")?.value;

  if (!raw) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dotIndex = raw.lastIndexOf(".");
  const sessionToken = dotIndex > 0 ? raw.slice(0, dotIndex) : raw;

  return NextResponse.json({ sessionToken });
}
