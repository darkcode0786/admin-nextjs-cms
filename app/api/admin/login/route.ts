import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OTP_COOKIE, isAdminEmail, otpMatches } from "@/lib/adminOtp";
import { SESSION_COOKIE, expectedSessionToken } from "@/lib/auth";

const SESSION_MAX_AGE = 60 * 60 * 24 * 400;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; code?: string } | null;
  const email = body?.email?.trim() || "";
  const code = body?.code?.trim() || "";
  const ticket = (await cookies()).get(OTP_COOKIE)?.value;
  const result = otpMatches(ticket, email, code);
  if (!isAdminEmail(email) || !result.ok) {
    const response = NextResponse.json({ error: "That code is not correct." }, { status: 401 });
    if (result.ticket) {
      response.cookies.set(OTP_COOKIE, result.ticket, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 10,
      });
    }
    return response;
  }
  const token = expectedSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Session is not configured." }, { status: 500 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OTP_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
