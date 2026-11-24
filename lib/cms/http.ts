import { NextResponse } from "next/server";

export function jsonError(error: unknown, fallback = "Request failed") {
  const status = (error as { status?: number })?.status || 500;
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status });
}
