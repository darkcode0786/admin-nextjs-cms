"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LuEye, LuPencil, LuTrash2 } from "react-icons/lu";

type Item = {
  id: string;
  title?: string;
  name?: string;
  slug: string;
  status: "draft" | "published";
  image?: string;
  category?: string;
  author?: string;
  city?: string;
  region?: string;
  seoStatus: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function ResourceTable({
  endpoint,
  editBase,
  publicBase,
  createHref,
  createLabel,
  kind,
}: {
  endpoint: string;
  editBase: string;
  publicBase: string;
  createHref: string;
  createLabel: string;
  kind: "blog" | "location";
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const pageSize = 10;

  async function load(nextPage = page) {
    const params = new URLSearchParams({ page: String(nextPage), pageSize: String(pageSize) });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    const response = await fetch(`${endpoint}?${params}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not load records");
      return;
    }
    setItems(data.items);
    setTotal(data.total);
    setPage(data.page);
    if (data.categories) setCategories(data.categories);
    setError("");
  }

  useEffect(() => {
    const timer = setTimeout(() => { void load(1); }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, category]);

  async function remove(id: string) {
    setPendingDelete(null);
    const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Delete failed");
      return;
    }
    void load(page);
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">{kind === "blog" ? "Blogs" : "Location pages"}</h1>
        <Link href={createHref} className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark">{createLabel}</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={kind === "blog" ? "Search title or slug" : "Search location, city, or slug"} className="min-w-56 flex-1 rounded-xl border border-rose/25 bg-white px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-rose/25 bg-white px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        {kind === "blog" && (
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-rose/25 bg-white px-3 py-2 text-sm">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
      </div>
      {error && <p className="text-sm font-semibold text-rose">{error}</p>}
      <div className="overflow-auto rounded-2xl border border-rose/15 bg-white">
        <table className="min-w-[880px] w-full text-left text-sm">
          <thead className="bg-pink text-xs uppercase tracking-wide text-ink/70">
            <tr>
              <th className="px-3 py-3">Image</th>
              <th className="px-3 py-3">{kind === "blog" ? "Title" : "Location"}</th>
              <th className="px-3 py-3">Slug</th>
              {kind === "blog" ? <th className="px-3 py-3">Category</th> : <th className="px-3 py-3">City</th>}
              {kind === "blog" ? <th className="px-3 py-3">Author</th> : <th className="px-3 py-3">Region</th>}
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">SEO</th>
              <th className="px-3 py-3">Updated</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-rose/10">
                <td className="px-3 py-3">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : <span className="text-xs text-ink/40">None</span>}
                </td>
                <td className="px-3 py-3 font-semibold">{item.title || item.name}</td>
                <td className="px-3 py-3">{item.slug}</td>
                <td className="px-3 py-3">{kind === "blog" ? item.category : item.city}</td>
                <td className="px-3 py-3">{kind === "blog" ? item.author : item.region}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${item.status === "published" ? "bg-blue text-white" : "bg-pink text-rose"}`}>{item.status}</span>
                </td>
                <td className="px-3 py-3">{item.seoStatus}</td>
                <td className="px-3 py-3">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ""}</td>
                <td className="px-3 py-3">
                  <div className="flex gap-2 text-xs font-bold">
                    <Link href={`${editBase}/${item.id}`} title="Edit" aria-label="Edit" className="inline-flex size-8 items-center justify-center rounded-lg border border-rose/30 text-rose"><LuPencil /></Link>
                    <button type="button" onClick={() => setPendingDelete(item.id)} title="Delete" aria-label="Delete" className="inline-flex size-8 items-center justify-center rounded-lg border border-rose/30 text-rose"><LuTrash2 /></button>
                    <a href={item.status === "published" ? `${publicBase}/${item.slug}` : `/admin/preview/${kind}/${item.slug}`} target="_blank" rel="noreferrer" title="View" aria-label="View" className="inline-flex size-8 items-center justify-center rounded-lg border border-rose/30 text-blue"><LuEye /></a>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-ink/60">No entries yet. Import the current website content from the dashboard, or create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <p>{total} total</p>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => load(page - 1)} className="rounded-full border border-rose/30 px-3 py-1 disabled:opacity-40">Previous</button>
          <span>{page} / {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => load(page + 1)} className="rounded-full border border-rose/30 px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(6,21,50,0.18)]">
            <p className="text-lg font-semibold text-ink">Delete this entry?</p>
            <p className="mt-2 text-sm text-ink">Are you sure you want to delete this entry?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-ink">Cancel</button>
              <button type="button" onClick={() => void remove(pendingDelete)} className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark">Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
