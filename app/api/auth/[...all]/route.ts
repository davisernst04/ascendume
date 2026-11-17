import { getAuth, isAuthConfigured } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!isAuthConfigured()) {
    if (request.nextUrl.pathname.endsWith("/get-session")) {
      return NextResponse.json(null);
    }
    return unavailable();
  }
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: NextRequest) {
  if (!isAuthConfigured()) return unavailable();
  return toNextJsHandler(getAuth()).POST(request);
}

function unavailable() {
  return NextResponse.json(
    { code: "AUTH_UNAVAILABLE", message: "Accounts are not available yet. Please check back later." },
    { status: 503 },
  );
}
