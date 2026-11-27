import { createHmac, randomInt, timingSafeEqual } from "crypto";
import nodemailer from "nodemailer";

export const OTP_COOKIE = "cms_otp";

export function requestIsSecure(request: Request) {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  return new URL(request.url).protocol === "https:";
}

type PendingOtp = { email: string; hash: string; expires: number; attempts: number };

function adminEmail() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.APP_PASSWORD || "";
}

export function isAdminEmail(email: string) {
  const allowed = adminEmail();
  return Boolean(allowed) && email.trim().toLowerCase() === allowed;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function packOtp(record: PendingOtp) {
  const payload = Buffer.from(JSON.stringify(record)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readOtp(value: string | undefined): PendingOtp | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PendingOtp;
  } catch {
    return null;
  }
}

export async function sendAdminOtp(email: string) {
  const to = email.trim().toLowerCase();
  if (!isAdminEmail(to)) {
    const error = new Error("This email is not allowed to sign in.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  const appPassword = (process.env.APP_PASSWORD || "").replace(/\s+/g, "");
  if (!appPassword || !secret()) {
    const error = new Error("Email login is not configured.");
    (error as Error & { status?: number }).status = 500;
    throw error;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const ticket = packOtp({
    email: to,
    hash: createHmac("sha256", secret()).update(code).digest("hex"),
    expires: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: adminEmail(), pass: appPassword },
  });

  const siteName = "Dr. Mona Dahiya";
  await transport.sendMail({
    from: `"${siteName}" <${adminEmail()}>`,
    to,
    subject: `${siteName} admin login code`,
    text: `${siteName}\n\nYour admin login code is ${code}. It expires in 10 minutes.\n\nIf you did not request this code, you can ignore this email.`,
    html: `
      <div style="margin:0;padding:32px 16px;background:#fff5f7;font-family:Tahoma,sans-serif;">
        <div style="max-width:460px;margin:0 auto;background:#ffffff;border:1px solid #e83e74;border-radius:16px;padding:28px;">
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#e83e74;">${siteName}</p>
          <h1 style="margin:10px 0 0;font-size:22px;font-weight:700;color:#0f2438;">Admin login code</h1>
          <p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:#0f2438;">Use this code to sign in to the ${siteName} admin. It expires in 10 minutes.</p>
          <p style="margin:22px 0;padding:14px 0;text-align:center;font-size:32px;font-weight:700;letter-spacing:0.28em;color:#0f2438;background:#fff5f7;border-radius:12px;">${code}</p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#0f2438;">If you did not request this code, you can ignore this email.</p>
        </div>
      </div>
    `,
  });
  return ticket;
}

export function otpMatches(ticket: string | undefined, email: string, code: string) {
  const record = readOtp(ticket);
  const key = email.trim().toLowerCase();
  const digits = code.replace(/\D/g, "");
  if (!record || record.email !== key || record.expires < Date.now() || record.attempts >= 5) {
    return { ok: false as const, ticket: "" };
  }
  const hash = createHmac("sha256", secret()).update(digits).digest("hex");
  const match =
    hash.length === record.hash.length &&
    timingSafeEqual(Buffer.from(hash), Buffer.from(record.hash));
  if (match) return { ok: true as const, ticket: "" };
  return { ok: false as const, ticket: packOtp({ ...record, attempts: record.attempts + 1 }) };
}
