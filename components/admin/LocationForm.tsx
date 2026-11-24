"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import type { LocationPageData } from "@/data/locations";
import type { SeoFields } from "@/lib/cms/types";
import { emptySeo } from "@/lib/cms/types";
import ImageField from "./ImageField";
import LinkedField from "./LinkedField";
import SeoFieldsForm from "./SeoFieldsForm";
import { blankLocation, DEFAULT_NEXT_STEP, withBlankRows, withoutBlankRows } from "./defaults";

const input =
  "w-full rounded-xl border border-rose/25 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rose";

function RemoveButton({ onClick }: { onClick: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        title="Remove"
        aria-label="Remove"
        onClick={() => setOpen(true)}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-rose/30 bg-white text-rose"
      >
        <LuTrash2 />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(6,21,50,0.18)]">
            <p className="text-lg font-semibold text-ink">Remove this item?</p>
            <p className="mt-2 text-sm text-ink">Are you sure you want to remove this item?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-ink">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onClick();
                }}
                className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-rose/15 bg-white p-5">
      <h2 className="border-b border-rose/15 pb-3 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <input className={`${input} mt-1`} value={value} placeholder={placeholder || label} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full border border-rose/30 bg-white px-3 py-1.5 text-sm font-semibold text-rose">
      <LuPlus />
      {label}
    </button>
  );
}

export default function LocationForm({ id }: { id?: string }) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [slugLocked, setSlugLocked] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [content, setContent] = useState<LocationPageData>(blankLocation());
  const [pillsText, setPillsText] = useState("");
  const [seo, setSeo] = useState<SeoFields>(emptySeo());
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
    fetch(`/api/admin/locations/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load location");
        setSlug(data.slug);
        setSlugLocked(true);
        setStatus(data.status);
        const consultation = data.content?.consultation;
        const consultationEmpty = !consultation?.eyebrow?.trim() && !consultation?.title?.trim() && !consultation?.subtitle?.trim() && !consultation?.consultationDuration?.trim() && !consultation?.defaultClinic?.trim();
        setContent(withBlankRows({
          ...data.content,
          consultation: consultationEmpty ? { ...DEFAULT_NEXT_STEP } : consultation,
        }));
        setPillsText((data.content?.hero?.pills || []).join(", "));
        setSeo({ ...emptySeo(), ...data.seo });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const next = withBlankRows(content);
    const missing =
      next.indications.items.length !== content.indications.items.length ||
      next.checklist.items.length !== content.checklist.items.length ||
      next.protocol.items.length !== content.protocol.items.length ||
      next.whyConsult.items.length !== content.whyConsult.items.length ||
      next.howToReach.clinics.length !== content.howToReach.clinics.length ||
      next.nearbyAreas.items.length !== content.nearbyAreas.items.length ||
      next.costFactors.items.length !== content.costFactors.items.length ||
      next.faq.items.length !== content.faq.items.length;
    if (missing) setContent(next);
  }, [content]);

  function patch(next: LocationPageData) {
    setContent(next);
    setDirty(true);
  }

  async function save(nextStatus = status) {
    setError("");
    setMessage("");
    const nextContent = withoutBlankRows({
      ...content,
      hero: {
        ...content.hero,
        pills: pillsText.split(",").map((pill) => pill.trim()).filter(Boolean),
      },
    });
    const response = await fetch(id ? `/api/admin/locations/${id}` : "/api/admin/locations", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, status: nextStatus, content: nextContent, seo }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setDirty(false);
    setStatus(nextStatus);
    setMessage(nextStatus === "published" ? "Published" : "Saved");
    if (!id) router.replace(`/admin/locations/${data.id}`);
  }

  if (loading) return <p className="text-sm text-ink/70">Loading location…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{id ? "Edit location" : "New location"}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (dirty) {
                setConfirmLeave(true);
                return;
              }
              router.push("/admin/locations");
            }}
            className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-ink"
          >
            Cancel
          </button>
          <button type="button" onClick={() => save("draft")} className="rounded-full border border-rose/30 bg-white px-4 py-2 text-sm font-semibold text-rose">Save draft</button>
          <button type="button" onClick={() => save("published")} className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark">Publish</button>
          {slug && (
            <a href={status === "published" ? `/location/${slug}` : `/admin/preview/location/${slug}`} target="_blank" rel="noreferrer" className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white">
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
              <button type="button" onClick={() => router.push("/admin/locations")} className="rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white hover:bg-rose-dark">Leave</button>
            </div>
          </div>
        </div>
      ) : null}
      {message && <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue">{message}</p>}
      {error && <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-rose">{error}</p>}

      <Section title="Hero">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.hero.eyebrow} onChange={(eyebrow) => patch({ ...content, hero: { ...content.hero, eyebrow } })} />
          <label className="text-sm font-semibold">Location name
            <input
              className={`${input} mt-1`}
              placeholder="Sector 49 Noida"
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
              placeholder="sector-49-noida"
              value={slug}
              onChange={(e) => {
                setSlugLocked(true);
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                setDirty(true);
              }}
            />
          </label>
          <label className="text-sm font-semibold">City / highlight
            <input className={`${input} mt-1`} placeholder="Sector 49, Noida" value={content.hero.highlightLocation} onChange={(e) => patch({ ...content, hero: { ...content.hero, highlightLocation: e.target.value } })} />
          </label>
          <label className="text-sm font-semibold">Status
            <select className={`${input} mt-1`} value={status} onChange={(e) => { setStatus(e.target.value as "draft" | "published"); setDirty(true); }}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-semibold">Description before city
          <LinkedField value={content.hero.descriptionPrefix} placeholder="Text before the city name" onChange={(descriptionPrefix) => patch({ ...content, hero: { ...content.hero, descriptionPrefix } })} />
        </label>
        <label className="block text-sm font-semibold">Description after city
          <LinkedField value={content.hero.descriptionSuffix} placeholder="Text after the city name" onChange={(descriptionSuffix) => patch({ ...content, hero: { ...content.hero, descriptionSuffix } })} />
        </label>
        <ImageField label="Featured image" folder="locations" value={content.hero.image} onChange={(image) => {
          const previous = content.hero.image;
          patch({ ...content, hero: { ...content.hero, image } });
          setSeo((current) => {
            const share = current.ogImage || current.twitterImage;
            if (share && share !== previous) return current;
            return { ...current, ogImage: image, twitterImage: image };
          });
        }} />
        <label className="block text-sm font-semibold">Image alt
          <input className={`${input} mt-1`} placeholder="Dr. Mona Dahiya" value={content.hero.imageAlt} onChange={(e) => patch({ ...content, hero: { ...content.hero, imageAlt: e.target.value } })} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Page title" value={content.metadata.title} onChange={(title) => patch({ ...content, metadata: { ...content.metadata, title } })} />
          <Field label="Page description" value={content.metadata.description} onChange={(description) => patch({ ...content, metadata: { ...content.metadata, description } })} />
        </div>
        <label className="block text-sm font-semibold">Pills, comma separated
          <input
            className={`${input} mt-1`}
            value={pillsText}
            placeholder="~8 km from the Sector 49 clinic, 25+ years' experience"
            onChange={(e) => {
              setPillsText(e.target.value);
              setDirty(true);
            }}
          />
        </label>

      </Section>

      <Section title="Registration">
        <Field label="Title" value={content.registration.title} onChange={(title) => patch({ ...content, registration: { ...content.registration, title } })} />
        <label className="block text-sm font-semibold">Subtitle
          <LinkedField value={content.registration.subtitle} placeholder="Registration subtitle" onChange={(subtitle) => patch({ ...content, registration: { ...content.registration, subtitle } })} />
        </label>
      </Section>

      <Section title="Indications">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.indications.eyebrow} onChange={(eyebrow) => patch({ ...content, indications: { ...content.indications, eyebrow } })} />
          <Field label="Title" value={content.indications.title} onChange={(title) => patch({ ...content, indications: { ...content.indications, title } })} />
        </div>
        {content.indications.items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-2xl border border-rose/15 bg-pink/50 p-3 md:grid-cols-[1fr_1fr_auto] md:items-start">
            <input className={input} value={item.title} placeholder="Title" onChange={(e) => {
              const items = content.indications.items.map((row, rowIndex) => rowIndex === index ? { ...row, title: e.target.value } : row);
              patch({ ...content, indications: { ...content.indications, items } });
            }} />
            <LinkedField value={item.description} placeholder="Description" onChange={(description) => {
              const items = content.indications.items.map((row, rowIndex) => rowIndex === index ? { ...row, description } : row);
              patch({ ...content, indications: { ...content.indications, items } });
            }} />
            <RemoveButton onClick={() => patch({ ...content, indications: { ...content.indications, items: content.indications.items.filter((_, rowIndex) => rowIndex !== index) } })} />
          </div>
        ))}
        <AddButton label="Add indication" onClick={() => patch({ ...content, indications: { ...content.indications, items: [...content.indications.items, { number: content.indications.items.length + 1, title: "", description: "" }] } })} />
      </Section>

      <Section title="Checklist">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.checklist.eyebrow} onChange={(eyebrow) => patch({ ...content, checklist: { ...content.checklist, eyebrow } })} />
          <Field label="Title" value={content.checklist.title} onChange={(title) => patch({ ...content, checklist: { ...content.checklist, title } })} />
        </div>
        <label className="block text-sm font-semibold">Subtitle
          <LinkedField value={content.checklist.subtitle} placeholder="Checklist subtitle" onChange={(subtitle) => patch({ ...content, checklist: { ...content.checklist, subtitle } })} />
        </label>
        {content.checklist.items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-2xl border border-rose/15 bg-pink/50 p-3 md:grid-cols-[1fr_1fr_auto] md:items-start">
            <input className={input} value={item.title} placeholder="Title" onChange={(e) => {
              const items = content.checklist.items.map((row, rowIndex) => rowIndex === index ? { ...row, title: e.target.value } : row);
              patch({ ...content, checklist: { ...content.checklist, items } });
            }} />
            <LinkedField value={item.description} placeholder="Description" onChange={(description) => {
              const items = content.checklist.items.map((row, rowIndex) => rowIndex === index ? { ...row, description } : row);
              patch({ ...content, checklist: { ...content.checklist, items } });
            }} />
            <RemoveButton onClick={() => patch({ ...content, checklist: { ...content.checklist, items: content.checklist.items.filter((_, rowIndex) => rowIndex !== index) } })} />
          </div>
        ))}
        <AddButton label="Add checklist item" onClick={() => patch({ ...content, checklist: { ...content.checklist, items: [...content.checklist.items, { title: "", description: "" }] } })} />
      </Section>

      <Section title="Treatment protocol">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.protocol.eyebrow} onChange={(eyebrow) => patch({ ...content, protocol: { ...content.protocol, eyebrow } })} />
          <Field label="Title" value={content.protocol.title} onChange={(title) => patch({ ...content, protocol: { ...content.protocol, title } })} />
        </div>
        {content.protocol.items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-2xl border border-rose/15 bg-pink/50 p-3 md:grid-cols-[1fr_1fr_auto] md:items-start">
            <input className={input} value={item.title} placeholder="Step title" onChange={(e) => {
              const items = content.protocol.items.map((row, rowIndex) => rowIndex === index ? { ...row, title: e.target.value } : row);
              patch({ ...content, protocol: { ...content.protocol, items } });
            }} />
            <LinkedField value={item.description} placeholder="Step description" onChange={(description) => {
              const items = content.protocol.items.map((row, rowIndex) => rowIndex === index ? { ...row, description } : row);
              patch({ ...content, protocol: { ...content.protocol, items } });
            }} />
            <RemoveButton onClick={() => patch({ ...content, protocol: { ...content.protocol, items: content.protocol.items.filter((_, rowIndex) => rowIndex !== index) } })} />
          </div>
        ))}
        <AddButton label="Add step" onClick={() => patch({ ...content, protocol: { ...content.protocol, items: [...content.protocol.items, { step: content.protocol.items.length + 1, title: "", description: "" }] } })} />
      </Section>

      <Section title="Why consult">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.whyConsult.eyebrow} onChange={(eyebrow) => patch({ ...content, whyConsult: { ...content.whyConsult, eyebrow } })} />
          <Field label="Title" value={content.whyConsult.title} onChange={(title) => patch({ ...content, whyConsult: { ...content.whyConsult, title } })} />
        </div>
        {content.whyConsult.items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-2xl border border-rose/15 bg-pink/50 p-3 md:grid-cols-[1fr_1fr_auto] md:items-start">
            <input className={input} value={item.title} placeholder="Reason" onChange={(e) => {
              const items = content.whyConsult.items.map((row, rowIndex) => rowIndex === index ? { ...row, title: e.target.value } : row);
              patch({ ...content, whyConsult: { ...content.whyConsult, items } });
            }} />
            <LinkedField value={item.description} placeholder="Reason description" onChange={(description) => {
              const items = content.whyConsult.items.map((row, rowIndex) => rowIndex === index ? { ...row, description } : row);
              patch({ ...content, whyConsult: { ...content.whyConsult, items } });
            }} />
            <RemoveButton onClick={() => patch({ ...content, whyConsult: { ...content.whyConsult, items: content.whyConsult.items.filter((_, rowIndex) => rowIndex !== index) } })} />
          </div>
        ))}
        <AddButton label="Add reason" onClick={() => patch({ ...content, whyConsult: { ...content.whyConsult, items: [...content.whyConsult.items, { title: "", description: "" }] } })} />
      </Section>

      <Section title="Scenario">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.scenario.eyebrow} onChange={(eyebrow) => patch({ ...content, scenario: { ...content.scenario, eyebrow } })} />
          <Field label="Title" value={content.scenario.title} onChange={(title) => patch({ ...content, scenario: { ...content.scenario, title } })} />
        </div>
        <label className="block text-sm font-semibold">Text
          <LinkedField value={content.scenario.text} placeholder="Scenario text" onChange={(text) => patch({ ...content, scenario: { ...content.scenario, text } })} />
        </label>
        <label className="block text-sm font-semibold">Disclaimer
          <LinkedField value={content.scenario.disclaimer} placeholder="Disclaimer" onChange={(disclaimer) => patch({ ...content, scenario: { ...content.scenario, disclaimer } })} />
        </label>

      </Section>

      <Section title="How to reach">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.howToReach.eyebrow} onChange={(eyebrow) => patch({ ...content, howToReach: { ...content.howToReach, eyebrow } })} />
          <Field label="Title" value={content.howToReach.title} onChange={(title) => patch({ ...content, howToReach: { ...content.howToReach, title } })} />
          <Field label="Starting place" value={content.howToReach.originLabel} onChange={(originLabel) => patch({ ...content, howToReach: { ...content.howToReach, originLabel } })} />
        </div>
        <label className="block text-sm font-semibold">Subtitle
          <LinkedField value={content.howToReach.subtitle} placeholder="How to reach subtitle" onChange={(subtitle) => patch({ ...content, howToReach: { ...content.howToReach, subtitle } })} />
        </label>
        {content.howToReach.clinics.map((clinic, index) => (
          <div key={index} className="space-y-2 rounded-2xl border border-rose/15 bg-pink/50 p-3">
            <div className="flex items-center justify-end">
              <RemoveButton onClick={() => patch({ ...content, howToReach: { ...content.howToReach, clinics: content.howToReach.clinics.filter((_, rowIndex) => rowIndex !== index) } })} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
            <Field label="Tag" value={clinic.tag} onChange={(tag) => {
              const clinics = content.howToReach.clinics.map((row, rowIndex) => rowIndex === index ? { ...row, tag } : row);
              patch({ ...content, howToReach: { ...content.howToReach, clinics } });
            }} />
            <Field label="Clinic" value={clinic.title} onChange={(title) => {
              const clinics = content.howToReach.clinics.map((row, rowIndex) => rowIndex === index ? { ...row, title } : row);
              patch({ ...content, howToReach: { ...content.howToReach, clinics } });
            }} />
            <Field label="Distance" value={clinic.distance} onChange={(distance) => {
              const clinics = content.howToReach.clinics.map((row, rowIndex) => rowIndex === index ? { ...row, distance } : row);
              patch({ ...content, howToReach: { ...content.howToReach, clinics } });
            }} />
            <Field label="Duration" value={clinic.duration} onChange={(duration) => {
              const clinics = content.howToReach.clinics.map((row, rowIndex) => rowIndex === index ? { ...row, duration } : row);
              patch({ ...content, howToReach: { ...content.howToReach, clinics } });
            }} />
            <Field label="Route" value={clinic.routeBadge} onChange={(routeBadge) => {
              const clinics = content.howToReach.clinics.map((row, rowIndex) => rowIndex === index ? { ...row, routeBadge } : row);
              patch({ ...content, howToReach: { ...content.howToReach, clinics } });
            }} />
            <Field label="Link label" value={clinic.linkLabel} onChange={(linkLabel) => {
              const clinics = content.howToReach.clinics.map((row, rowIndex) => rowIndex === index ? { ...row, linkLabel } : row);
              patch({ ...content, howToReach: { ...content.howToReach, clinics } });
            }} />
            <div className="md:col-span-2">
            <Field label="Link address" value={clinic.linkHref} onChange={(linkHref) => {
              const clinics = content.howToReach.clinics.map((row, rowIndex) => rowIndex === index ? { ...row, linkHref } : row);
              patch({ ...content, howToReach: { ...content.howToReach, clinics } });
            }} />
            </div>
            </div>
            <div className="grid items-start gap-2 md:grid-cols-2">
            <LinkedField rows={3} value={clinic.byRoad} placeholder="By road" onChange={(byRoad) => {
              const clinics = content.howToReach.clinics.map((row, rowIndex) => rowIndex === index ? { ...row, byRoad } : row);
              patch({ ...content, howToReach: { ...content.howToReach, clinics } });
            }} />
            <LinkedField rows={3} value={clinic.byMetro} placeholder="By metro" onChange={(byMetro) => {
              const clinics = content.howToReach.clinics.map((row, rowIndex) => rowIndex === index ? { ...row, byMetro } : row);
              patch({ ...content, howToReach: { ...content.howToReach, clinics } });
            }} />
            </div>
          </div>
        ))}
        <AddButton label="Add clinic route" onClick={() => patch({ ...content, howToReach: { ...content.howToReach, clinics: [...content.howToReach.clinics, { number: content.howToReach.clinics.length + 1, tag: "", title: "", distance: "", duration: "", routeBadge: "", byRoad: "", byMetro: "", linkLabel: "Clinic page", linkHref: "/location" }] } })} />
      </Section>

      <Section title="Nearby areas">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.nearbyAreas.eyebrow} onChange={(eyebrow) => patch({ ...content, nearbyAreas: { ...content.nearbyAreas, eyebrow } })} />
          <Field label="Title" value={content.nearbyAreas.title} onChange={(title) => patch({ ...content, nearbyAreas: { ...content.nearbyAreas, title } })} />
        </div>
        {content.nearbyAreas.items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-2xl border border-rose/15 bg-pink/50 p-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-start">
            <input className={input} value={item.title} placeholder="Area name" onChange={(e) => {
              const items = content.nearbyAreas.items.map((row, rowIndex) => rowIndex === index ? { ...row, title: e.target.value } : row);
              patch({ ...content, nearbyAreas: { ...content.nearbyAreas, items } });
            }} />
            <input className={input} value={item.subtitle} placeholder="Short note" onChange={(e) => {
              const items = content.nearbyAreas.items.map((row, rowIndex) => rowIndex === index ? { ...row, subtitle: e.target.value } : row);
              patch({ ...content, nearbyAreas: { ...content.nearbyAreas, items } });
            }} />
            <input className={input} value={item.href} placeholder="/location/sector-18" onChange={(e) => {
              const items = content.nearbyAreas.items.map((row, rowIndex) => rowIndex === index ? { ...row, href: e.target.value } : row);
              patch({ ...content, nearbyAreas: { ...content.nearbyAreas, items } });
            }} />
            <RemoveButton onClick={() => patch({ ...content, nearbyAreas: { ...content.nearbyAreas, items: content.nearbyAreas.items.filter((_, rowIndex) => rowIndex !== index) } })} />
          </div>
        ))}
        <AddButton label="Add nearby area" onClick={() => patch({ ...content, nearbyAreas: { ...content.nearbyAreas, items: [...content.nearbyAreas.items, { title: "", subtitle: "", href: "/location" }] } })} />
      </Section>

      <Section title="Cost factors">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.costFactors.eyebrow} onChange={(eyebrow) => patch({ ...content, costFactors: { ...content.costFactors, eyebrow } })} />
          <Field label="Title" value={content.costFactors.title} onChange={(title) => patch({ ...content, costFactors: { ...content.costFactors, title } })} />
        </div>
        <label className="block text-sm font-semibold">Subtitle
          <LinkedField value={content.costFactors.subtitle} placeholder="Cost subtitle" onChange={(subtitle) => patch({ ...content, costFactors: { ...content.costFactors, subtitle } })} />
        </label>
        {content.costFactors.items.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-2xl border border-rose/15 bg-pink/50 p-3 md:flex-row md:items-center">
            <select className={`${input} md:w-40`} value={item.icon} onChange={(e) => {
              const items = content.costFactors.items.map((row, rowIndex) => rowIndex === index ? { ...row, icon: e.target.value as typeof row.icon } : row);
              patch({ ...content, costFactors: { ...content.costFactors, items } });
            }}>
              <option value="medicine">Medicine</option>
              <option value="lab">Lab</option>
              <option value="calendar">Calendar</option>
              <option value="check">Check</option>
            </select>
            <input className={`${input} md:flex-1`} value={item.title} placeholder="Cost factor" onChange={(e) => {
              const items = content.costFactors.items.map((row, rowIndex) => rowIndex === index ? { ...row, title: e.target.value } : row);
              patch({ ...content, costFactors: { ...content.costFactors, items } });
            }} />
            <div className="min-w-0 md:flex-1">
            <LinkedField rows={1} value={item.description} placeholder="Cost description" onChange={(description) => {
              const items = content.costFactors.items.map((row, rowIndex) => rowIndex === index ? { ...row, description } : row);
              patch({ ...content, costFactors: { ...content.costFactors, items } });
            }} />
            </div>
            <RemoveButton onClick={() => patch({ ...content, costFactors: { ...content.costFactors, items: content.costFactors.items.filter((_, rowIndex) => rowIndex !== index) } })} />
          </div>
        ))}
        <AddButton label="Add cost factor" onClick={() => patch({ ...content, costFactors: { ...content.costFactors, items: [...content.costFactors.items, { icon: "check", title: "", description: "" }] } })} />
      </Section>

      <Section title="FAQ">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.faq.eyebrow} onChange={(eyebrow) => patch({ ...content, faq: { ...content.faq, eyebrow } })} />
          <Field label="Title" value={content.faq.title} onChange={(title) => patch({ ...content, faq: { ...content.faq, title } })} />
        </div>
        <label className="block text-sm font-semibold">Subtitle
          <LinkedField value={content.faq.subtitle} placeholder="FAQ subtitle" onChange={(subtitle) => patch({ ...content, faq: { ...content.faq, subtitle } })} />
        </label>
        {content.faq.items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-2xl border border-rose/15 bg-pink/50 p-3">
            <div className="flex items-center gap-2">
              <input className={`${input} min-w-0 flex-1`} value={item.question} placeholder="Question" onChange={(e) => {
                const items = content.faq.items.map((row, rowIndex) => rowIndex === index ? { ...row, question: e.target.value } : row);
                patch({ ...content, faq: { ...content.faq, items } });
              }} />
              <RemoveButton onClick={() => patch({ ...content, faq: { ...content.faq, items: content.faq.items.filter((_, rowIndex) => rowIndex !== index) } })} />
            </div>
            <LinkedField value={item.answer} placeholder="Answer" onChange={(answer) => {
              const items = content.faq.items.map((row, rowIndex) => rowIndex === index ? { ...row, answer } : row);
              patch({ ...content, faq: { ...content.faq, items } });
            }} />
          </div>
        ))}
        <AddButton label="Add FAQ" onClick={() => patch({ ...content, faq: { ...content.faq, items: [...content.faq.items, { question: "", answer: "" }] } })} />
      </Section>

      <Section title="Consultation">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow" value={content.consultation.eyebrow} onChange={(eyebrow) => patch({ ...content, consultation: { ...content.consultation, eyebrow } })} />
          <Field label="Title" value={content.consultation.title} onChange={(title) => patch({ ...content, consultation: { ...content.consultation, title } })} />
          <Field label="Duration" value={content.consultation.consultationDuration} onChange={(consultationDuration) => patch({ ...content, consultation: { ...content.consultation, consultationDuration } })} />
          <Field label="Clinic" value={content.consultation.defaultClinic} onChange={(defaultClinic) => patch({ ...content, consultation: { ...content.consultation, defaultClinic } })} />
        </div>
        <label className="block text-sm font-semibold">Subtitle
          <LinkedField value={content.consultation.subtitle} placeholder="Consultation subtitle" onChange={(subtitle) => patch({ ...content, consultation: { ...content.consultation, subtitle } })} />
        </label>
      </Section>
      <SeoFieldsForm seo={seo} folder="locations" onChange={(next) => { setSeo(next); setDirty(true); }} fallbackTitle={content.hero.title} fallbackDescription={content.hero.descriptionPrefix} fallbackImage={content.hero.image} />
    </div>
  );
}
