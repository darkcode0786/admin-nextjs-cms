"use client";

import { useEffect, useRef, useState } from "react";

type Stats = {
  blogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  locations: number;
  publishedLocations: number;
  draftLocations: number;
};

const cards = [
  ["blogs", "Total blogs"],
  ["publishedBlogs", "Published blogs"],
  ["draftBlogs", "Draft blogs"],
  ["locations", "Total location pages"],
  ["publishedLocations", "Published location pages"],
  ["draftLocations", "Draft location pages"],
] as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function loadStats() {
    fetch("/api/admin/stats")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load stats");
        setStats(data);
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function exportBackup() {
    setError("");
    setNotice("");
    setBusy(true);
    const response = await fetch("/api/admin/backup");
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error || "Could not export the backup.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cms-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Backup downloaded.");
  }

  async function importBackup() {
    if (!pendingFile) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const text = await pendingFile.text();
      const body = JSON.parse(text) as unknown;
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed");
      setNotice(`Restored ${data.blogs} blogs and ${data.locations} location pages.`);
      setPendingFile(null);
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink/70">Manage blogs and location pages. Only published pages appear on the site.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={exportBackup} disabled={busy} className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-dark disabled:opacity-60">
          Export backup
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} disabled={busy} className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-rose disabled:opacity-60">
          Import backup
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setPendingFile(file);
          }}
        />
      </div>
      {error && <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-rose">{error}</p>}
      {notice && <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue">{notice}</p>}
      {pendingFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(6,21,50,0.18)]">
            <p className="text-lg font-semibold text-ink">Import this backup?</p>
            <p className="mt-2 text-sm text-ink">Pages in {pendingFile.name} will replace blogs and locations that use the same slug. Other pages stay as they are.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setPendingFile(null); if (fileInput.current) fileInput.current.value = ""; }} className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-ink">Cancel</button>
              <button type="button" onClick={importBackup} disabled={busy} className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark disabled:opacity-60">Import</button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([key, label]) => (
          <div key={key} className="rounded-2xl border border-rose/15 bg-white p-5">
            <p className="text-sm font-semibold text-ink/70">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-rose">{stats ? stats[key] : "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
