import { emptySeo, type PublishStatus, type SeoFields } from "./types";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertSlug(slug: string) {
  if (!SLUG.test(slug)) {
    const error = new Error("Slug must use lowercase letters, numbers, and hyphens");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
}

export function assertStatus(status: string): PublishStatus {
  if (status !== "draft" && status !== "published") {
    const error = new Error("Status must be draft or published");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }
  return status;
}

export function normalizeSeo(input: unknown): SeoFields {
  const source = (input ?? {}) as Partial<SeoFields>;
  return {
    ...emptySeo(),
    ...source,
    metaTitle: String(source.metaTitle ?? ""),
    metaDescription: String(source.metaDescription ?? ""),
    metaKeywords: String(source.metaKeywords ?? ""),
    canonicalUrl: String(source.canonicalUrl ?? ""),
    ogTitle: String(source.ogTitle ?? ""),
    ogDescription: String(source.ogDescription ?? ""),
    ogImage: String(source.ogImage ?? ""),
    twitterTitle: String(source.twitterTitle ?? ""),
    twitterDescription: String(source.twitterDescription ?? ""),
    twitterImage: String(source.twitterImage ?? ""),
    noIndex: Boolean(source.noIndex),
    noFollow: Boolean(source.noFollow),
    schemaMarkup: String(source.schemaMarkup ?? ""),
  };
}

export function withShareImage(seo: SeoFields, banner?: string): SeoFields {
  const image = seo.ogImage.trim() || seo.twitterImage.trim() || banner?.trim() || "";
  return { ...seo, ogImage: image, twitterImage: seo.twitterImage.trim() || image };
}

export function withCanonical(seo: SeoFields, path: string): SeoFields {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://drmonadahiya.com").replace(/\/+$/, "");
  const clean = path.startsWith("/") ? path : `/${path}`;
  return { ...seo, canonicalUrl: `${base}${clean}` };
}

export function readPage(url: string) {
  const { searchParams } = new URL(url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize") || 10)));
  return { page, pageSize, searchParams };
}
