"use client";

import { useState } from "react";

const input =
  "w-full rounded-xl border border-rose/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rose";

export default function ImageField({
  label,
  value,
  folder,
  onChange,
}: {
  label: string;
  value: string;
  folder: "blogs" | "locations" | "general";
  onChange: (value: string) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const body = new FormData();
    body.set("file", file);
    body.set("folder", folder);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    onChange(data.url);
  }

  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-24 w-24 rounded-xl border border-rose/20 object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-rose/30 bg-pink text-xs text-ink/50">No image</div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input className={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/..." />
          <label className={`inline-flex cursor-pointer items-center rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark ${busy ? "pointer-events-none opacity-60" : ""}`}>
            {busy ? "Uploading…" : value ? "Change" : "Choose file"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={busy}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
                e.target.value = "";
              }}
            />
          </label>
          {error && <p className="text-xs font-semibold text-rose">{error}</p>}
        </div>
      </div>
    </div>
  );
}
