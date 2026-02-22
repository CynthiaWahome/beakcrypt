import { NextRequest, NextResponse } from "next/server";

const BETA_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function GET(request: NextRequest) {
  const url = new URL("/", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set("private-beta", "true", {
    path: "/",
    maxAge: BETA_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return response;
}
