import { handlers } from "~/server/auth";
import { authLimiter, getIpFromRequest } from "~/lib/rate-limit";
import { NextResponse, type NextRequest } from "next/server";

const { GET: authGET, POST: authPOST } = handlers;

export const GET = authGET;

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const { success } = await authLimiter.limit(ip);

  if (!success) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("error", "RateLimited");

    return NextResponse.json(
      {
        url: signInUrl.toString(),
        error: "RateLimited",
        message: "Too many sign-in attempts. Please wait about a minute.",
      },
      { status: 429 },
    );
  }

  return authPOST(req);
}
