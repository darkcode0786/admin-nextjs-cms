"use client";

import { useEffect, useState } from "react";
import type { SeoFields } from "@/lib/cms/types";
import ImageField from "./ImageField";

function schemaStatus(value: string) {
  const text = value.trim();
  if (!text) return null;
  try {
    JSON.parse(text);
    return "added" as const;
  } catch {
    return "invalid" as const;
  }
}

function SchemaField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [open, setOpen] = useState(Boolean(value?.trim()));
  useEffect(() => {
    if (value?.trim()) setOpen(true);
  }, [value]);
  const status = schemaStatus(value ?? "");

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-rose/15 bg-pink px-4 py-3">
        <p className="text-sm font-semibold text-ink">No schema added</p>
        <button
          type="button"
          className="rounded-full bg-rose px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-dark"
          onClick={() => setOpen(true)}
        >
          Add schema
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">
          Schema{" "}
          {status ? (
            <span className={status === "added" ? "text-blue" : "text-rose"}>
              {status === "added" ? "added" : "needs valid JSON"}
            </span>
          ) : (
            <span className="text-ink/50">empty</span>
          )}
        </p>
        <button
          type="button"
          className="rounded-full border border-rose/30 bg-white px-3 py-1.5 text-xs font-semibold text-rose"
          onClick={() => setConfirmRemove(true)}
        >
          Remove schema
        </button>
      </div>
      <textarea
        className={`${input} min-h-40 font-sans`}
        value={value ?? ""}
        placeholder="Paste your custom JSON-LD schema"
        onChange={(e) => onChange(e.target.value)}
      />
      {confirmRemove ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(6,21,50,0.18)]">
            <p className="text-lg font-semibold text-ink">Remove schema?</p>
            <p className="mt-2 text-sm text-ink">This schema will be removed from the page. Save to keep the change.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmRemove(false)} className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-ink">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setConfirmRemove(false);
                }}
                className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const input =
  "w-full rounded-xl border border-rose/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rose focus:ring-2 focus:ring-rose/15";

export default function SeoFieldsForm({
  seo,
  onChange,
  fallbackTitle,
  fallbackDescription,
  fallbackImage = "",
  folder = "general",
}: {
  seo: SeoFields;
  onChange: (seo: SeoFields) => void;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackImage?: string;
  folder?: "blogs" | "locations" | "general";
}) {
  const set = (key: keyof SeoFields, value: string | boolean) =>
    onChange({ ...seo, [key]: value });
  const title = seo.metaTitle || fallbackTitle;
  const description = seo.metaDescription || fallbackDescription;

  return (
    <section className="space-y-4 rounded-2xl border border-rose/15 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold text-ink">SEO</h2>
        <p className="text-sm text-ink/70">Stored for this page only. Empty fields fall back to the page title, description, and featured image.</p>
      </div>
      <label className="block text-sm font-semibold">
        Meta title
        <input
          className={`${input} mt-1`}
          placeholder="Page title for search results"
          value={seo.metaTitle}
          onChange={(e) =>
            onChange({
              ...seo,
              metaTitle: e.target.value,
              ogTitle: e.target.value,
              twitterTitle: e.target.value,
            })
          }
        />
        <span className="mt-1 block text-xs font-medium text-ink/60">{seo.metaTitle.length} characters · aim for about 60. Also used for Open Graph and Twitter.</span>
      </label>
      <label className="block text-sm font-semibold">
        Meta description
        <textarea
          className={`${input} mt-1 min-h-24`}
          placeholder="Short description for search results"
          value={seo.metaDescription}
          onChange={(e) =>
            onChange({
              ...seo,
              metaDescription: e.target.value,
              ogDescription: e.target.value,
              twitterDescription: e.target.value,
            })
          }
        />
        <span className="mt-1 block text-xs font-medium text-ink/60">{seo.metaDescription.length} characters · aim for about 160. Also used for Open Graph and Twitter.</span>
      </label>
      <label className="block text-sm font-semibold">
        Meta keywords
        <input className={`${input} mt-1`} value={seo.metaKeywords} onChange={(e) => set("metaKeywords", e.target.value)} placeholder="ivf noida, fertility doctor" />
      </label>
      <ImageField
        label="Share image"
        folder={folder}
        value={seo.ogImage || seo.twitterImage || fallbackImage}
        onChange={(image) => onChange({ ...seo, ogImage: image, twitterImage: image })}
      />
      <p className="-mt-2 text-xs font-medium text-ink/60">Uses the banner image until you choose a different one. Used for Open Graph and Twitter.</p>
      <SchemaField
        value={seo.schemaMarkup}
        onChange={(schemaMarkup) => set("schemaMarkup", schemaMarkup)}
      />
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <label className="flex items-center gap-2"><input type="checkbox" checked={seo.noIndex} onChange={(e) => set("noIndex", e.target.checked)} /> No index</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={seo.noFollow} onChange={(e) => set("noFollow", e.target.checked)} /> No follow</label>
      </div>
      <div className="rounded-xl border border-rose/20 bg-pink p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-rose">Search preview</p>
        <p className="mt-2 text-base font-semibold text-blue">{title || "Page title"}</p>
        <p className="mt-1 text-sm text-ink/80">{description || "Description preview"}</p>
      </div>
    </section>
  );
}
