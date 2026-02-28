import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get("better-auth.session_token")?.value;

	if (!sessionToken) {
		return NextResponse.json(
			{ error: "Not authenticated" },
			{ status: 401 },
		);
	}

	return NextResponse.json({ sessionToken });
}
