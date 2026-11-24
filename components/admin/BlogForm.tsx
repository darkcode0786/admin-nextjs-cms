"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPostData } from "@/data/blogTypes";
import type { SeoFields } from "@/lib/cms/types";
import { emptySeo } from "@/lib/cms/types";
import ArticleEditor from "./ArticleEditor";
import DateField from "./DateField";
import { htmlToSections, sectionsToHtml } from "./articleHtml";
import ImageField from "./ImageField";
import SeoFieldsForm from "./SeoFieldsForm";
import { blankBlog } from "./defaults";

const input =
  "w-full rounded-xl border border-rose/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rose";

export default function BlogForm({ id }: { id?: string }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [slugLocked, setSlugLocked] = useState(false);
  const [tagsText, setTagsText] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [author, setAuthor] = useState("Dr. Mona Dahiya");
  const [content, setContent] = useState<BlogPostData>(blankBlog());
  const [seo, setSeo] = useState<SeoFields>(emptySeo());
  const [articleHtml, setArticleHtml] = useState(() => sectionsToHtml(blankBlog().sections));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/blogs/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load blog");
        setSlug(data.slug);
        setSlugLocked(true);
        setTagsText((data.content?.meta?.tags || []).join(", "));
        setStatus(data.status);
        setAuthor(data.author || "Dr. Mona Dahiya");
        setContent(data.content);
        setArticleHtml(sectionsToHtml(data.content.sections || []));
        setSeo({ ...emptySeo(), ...data.seo });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function patch(next: BlogPostData) {
    setContent(next);
    setDirty(true);
  }

  async function save(nextStatus = status) {
    setError("");
    setMessage("");
    const response = await fetch(id ? `/api/admin/blogs/${id}` : "/api/admin/blogs", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      slug,
      status: nextStatus,
      author,
      content: {
        ...content,
        meta: {
          ...content.meta,
          tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
        },
      },
      seo,
    }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setDirty(false);
    setStatus(nextStatus);
    setMessage(nextStatus === "published" ? "Published" : "Saved");
    if (!id) router.replace(`/admin/blogs/${data.id}`);
  }

  if (loading) return <p className="text-sm text-ink/70">Loading blog…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">{id ? "Edit blog" : "New blog"}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (dirty) {
                setConfirmLeave(true);
                return;
              }
              router.push("/admin/blogs");
            }}
            className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-ink"
          >
            Cancel
          </button>
          <button type="button" onClick={() => save("draft")} className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-rose">Save draft</button>
          <button type="button" onClick={() => save("published")} className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark">Publish</button>
          {slug && (
            <a href={status === "published" ? `/blog/${slug}` : `/admin/preview/blog/${slug}`} target="_blank" className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white" rel="noreferrer">
              {status === "published" ? "View" : "Preview"}
            </a>
          )}
        </div>
      </div>
      {confirmLeave ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(6,21,50,0.18)]">
            <p className="text-lg font-semibold text-ink">Leave without saving?</p>
            <p className="mt-2 text-sm text-ink">You have unsaved changes. Are you sure you want to cancel?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmLeave(false)} className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-ink">Stay</button>
              <button type="button" onClick={() => router.push("/admin/blogs")} className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark">Leave</button>
            </div>
          </div>
        </div>
      ) : null}
      {message && <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue">{message}</p>}
      {error && <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-rose">{error}</p>}

      <section className="space-y-4 rounded-2xl border border-rose/15 bg-white p-5">
        <h2 className="text-lg font-semibold">Content</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">Title
            <input
              className={`${input} mt-1`}
              placeholder="Blog title"
              value={content.hero.title}
              onChange={(e) => {
                const title = e.target.value;
                patch({ ...content, hero: { ...content.hero, title, breadcrumbLabel: title } });
                if (!slugLocked) {
                  setSlug(title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                }
              }}
            />
          </label>
          <label className="text-sm font-semibold">Slug
            <input
              className={`${input} mt-1`}
              placeholder="blog-title"
              value={slug}
              onChange={(e) => {
                setSlugLocked(true);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                setDirty(true);
              }}
            />
          </label>
          <label className="text-sm font-semibold">Author
            <input className={`${input} mt-1`} placeholder="Dr. Mona Dahiya" value={author} onChange={(e) => { setAuthor(e.target.value); setDirty(true); }} />
          </label>
          <label className="text-sm font-semibold">Status
            <select className={`${input} mt-1`} value={status} onChange={(e) => { setStatus(e.target.value as "draft" | "published"); setDirty(true); }}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <div className="text-sm font-semibold">Date
            <DateField
              value={content.meta.date}
              onChange={(date) => patch({ ...content, meta: { ...content.meta, date } })}
            />
          </div>
          <label className="text-sm font-semibold">Tags (comma separated)
            <input
              className={`${input} mt-1`}
              placeholder="IVF, fertility, Noida"
              value={tagsText}
              onChange={(e) => {
                setTagsText(e.target.value);
                setDirty(true);
              }}
            />
          </label>
        </div>
        <label className="block text-sm font-semibold">Eyebrow
          <input className={`${input} mt-1`} placeholder="Fertility guide" value={content.hero.eyebrow} onChange={(e) => patch({ ...content, hero: { ...content.hero, eyebrow: e.target.value } })} />
        </label>
        <ImageField
          label="Featured image"
          folder="blogs"
          value={content.meta.image?.src || ""}
          onChange={(src) => {
            const previous = content.meta.image?.src || "";
            patch({
              ...content,
              meta: {
                ...content.meta,
                image: src ? { src, alt: content.meta.image?.alt || content.hero.title } : undefined,
              },
            });
            setSeo((current) => {
              const share = current.ogImage || current.twitterImage;
              if (share && share !== previous) return current;
              return { ...current, ogImage: src, twitterImage: src };
            });
          }}
        />
        <label className="block text-sm font-semibold">Image alt
          <input className={`${input} mt-1`} placeholder="Dr. Mona Dahiya" value={content.meta.image?.alt || ""} onChange={(e) => patch({ ...content, meta: { ...content.meta, image: { src: content.meta.image?.src || "", alt: e.target.value } } })} />
        </label>
        <div>
          <h3 className="mb-2 font-semibold">Article</h3>
          <ArticleEditor
            html={articleHtml}
            onChange={(html) => {
              setArticleHtml(html);
              patch({ ...content, sections: htmlToSections(html) });
            }}
          />
        </div>
      </section>
      <SeoFieldsForm seo={seo} folder="blogs" onChange={(next) => { setSeo(next); setDirty(true); }} fallbackTitle={content.hero.title} fallbackDescription={content.metadata.description} fallbackImage={content.meta.image?.src || ""} />
    </div>
  );
}
