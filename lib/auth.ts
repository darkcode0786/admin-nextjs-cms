import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "cms_session";

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.APP_PASSWORD || "";
}

export function expectedSessionToken() {
  const secret = sessionSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update("cms-admin-v1").digest("hex");
}

export async function isAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const expected = expectedSessionToken();
  if (!token || !expected || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export async function requireAdmin() {
  if (!(await isAdmin())) {
    const error = new Error("Unauthorized");
    (error as Error & { status?: number }).status = 401;
    throw error;
  }
}
