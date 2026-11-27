import type { Metadata } from "next";
import type { SeoFields } from "./types";

function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://drmonadahiya.com";
  return raw.replace(/\/+$/, "");
}

function absoluteUrl(value: string) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const base = siteUrl();
  if (!base) return value;
  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function buildPageMetadata(input: {
  path: string;
  seo?: Partial<SeoFields> | null;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackImage?: string;
}): Metadata {
  const seo = input.seo ?? {};
  const title = seo.metaTitle?.trim() || input.fallbackTitle || "Dr. Mona Dahiya";
  const description = clip(
    seo.metaDescription?.trim() || input.fallbackDescription || input.fallbackTitle || "",
    160,
  );
  const canonical = seo.canonicalUrl?.trim() || (siteUrl() ? `${siteUrl()}${input.path}` : input.path);
  const image = seo.ogImage?.trim() || input.fallbackImage || "";
  const twitterImage = seo.twitterImage?.trim() || image;
  const keywords = seo.metaKeywords
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords: keywords && keywords.length > 0 ? keywords : undefined,
    alternates: { canonical },
    robots: {
      index: !seo.noIndex,
      follow: !seo.noFollow,
    },
    openGraph: {
      title: seo.ogTitle?.trim() || title,
      description: seo.ogDescription?.trim() || description,
      url: canonical,
      type: "article",
      images: image ? [{ url: absoluteUrl(image) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.twitterTitle?.trim() || title,
      description: seo.twitterDescription?.trim() || description,
      images: twitterImage ? [absoluteUrl(twitterImage)] : undefined,
    },
  };
}
