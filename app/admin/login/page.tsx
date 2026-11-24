"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import siteData from "@/data/site.json";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { brand } = siteData.navbar;

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const response = await fetch("/api/admin/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error || "Could not send the code.");
      return;
    }
    setSent(true);
  }

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("That code is not correct.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-pink px-4">
      <form onSubmit={sent ? signIn : sendCode} className="w-full max-w-md rounded-2xl border border-rose/15 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose">{brand.name}</p>
        <p className="mt-1 text-sm font-medium text-ink/70">{brand.tagline}</p>
        <h1 className="mt-4 text-2xl font-semibold text-ink">Admin login</h1>
        <p className="mt-2 text-sm text-ink/70">Sign in with a code sent to the {brand.name} admin email.</p>
        <label className="mt-5 block text-sm font-semibold text-ink">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="mt-1 w-full rounded-xl border border-rose/25 px-3 py-2 outline-none focus:border-rose"
          />
        </label>
        {sent ? (
          <label className="mt-4 block text-sm font-semibold text-ink">
            Login code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-rose/25 px-3 py-2 outline-none focus:border-rose"
            />
          </label>
        ) : null}
        {error && <p className="mt-3 text-sm font-semibold text-rose">{error}</p>}
        <button type="submit" disabled={busy} className="mt-5 w-full rounded-full bg-rose py-2.5 text-sm font-semibold text-white hover:bg-rose-dark disabled:opacity-60">
          {busy ? "Please wait" : sent ? "Sign in" : "Send code"}
        </button>
        {sent ? (
          <button
            type="button"
            className="mt-3 w-full text-sm font-semibold text-rose"
            onClick={() => {
              setSent(false);
              setCode("");
              setError("");
            }}
          >
            Use a different email
          </button>
        ) : null}
      </form>
    </main>
  );
}
