import { NextResponse } from "next/server";
import { OTP_COOKIE, sendAdminOtp } from "@/lib/adminOtp";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim() || "";
  if (!email) {
    return NextResponse.json({ error: "Enter the admin email." }, { status: 400 });
  }
  try {
    const ticket = await sendAdminOtp(email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(OTP_COOKIE, ticket, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    const message = error instanceof Error ? error.message : "Could not send the code.";
    return NextResponse.json({ error: message }, { status });
  }
}
