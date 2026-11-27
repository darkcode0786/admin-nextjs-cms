import type { BlogPostData } from "@/data/blogTypes";
import type { LocationPageData } from "@/data/locations";
import { BLOG_POSTS } from "@/data/blogs";
import { BLOG_LISTING_ARTICLES } from "@/data/blogListing";
import { LOCATION_PAGES } from "@/data/locations";
import { connection } from "next/server";
import { connectDb } from "@/lib/db/mongoose";
import { BlogModel } from "@/lib/models/Blog";
import { LocationModel } from "@/lib/models/Location";
import { emptySeo, type SeoFields } from "./types";

export type BlogRecord = {
  id: string;
  slug: string;
  status: "draft" | "published";
  author: string;
  content: BlogPostData;
  seo: SeoFields;
  createdAt?: string;
  updatedAt?: string;
};

export type LocationRecord = {
  id: string;
  slug: string;
  status: "draft" | "published";
  city: string;
  region: string;
  content: LocationPageData;
  seo: SeoFields;
  createdAt?: string;
  updatedAt?: string;
};

function asSeo(value: unknown): SeoFields {
  return { ...emptySeo(), ...(value as Partial<SeoFields> | undefined) };
}

async function blogCollectionReady() {
  await connection();
  await connectDb();
  const count = await BlogModel.estimatedDocumentCount();
  return count > 0;
}

export function invalidateCmsCache() {}

function staticBlog(slug: string): BlogRecord | null {
  const content = BLOG_POSTS.find((post) => post.slug === slug);
  if (!content) return null;
  return {
    id: `static-${slug}`,
    slug,
    status: "published",
    author: "Dr. Mona Dahiya",
    content,
    seo: {
      ...emptySeo(),
      metaTitle: content.metadata.title,
      metaDescription: content.metadata.description,
    },
  };
}

function staticLocation(slug: string): LocationRecord | null {
  const content = LOCATION_PAGES.find((page) => page.slug === slug);
  if (!content) return null;
  const place = deriveLocationPlace(content);
  return {
    id: `static-${slug}`,
    slug,
    status: "published",
    city: place.city,
    region: place.region,
    content,
    seo: {
      ...emptySeo(),
      metaTitle: content.metadata.title,
      metaDescription: content.metadata.description,
    },
  };
}

export function deriveLocationPlace(content: LocationPageData) {
  const blob = `${content.slug} ${content.hero.highlightLocation} ${content.hero.title}`.toLowerCase();
  let region = "Noida";
  if (blob.includes("ghaziabad")) region = "Ghaziabad";
  else if (blob.includes("delhi") || blob.includes("lajpat")) region = "Delhi";
  else if (blob.includes("greater noida") || blob.includes("greater-noida")) region = "Greater Noida";
  return {
    city: content.hero.highlightLocation || content.hero.breadcrumbLabel || region,
    region,
  };
}

export async function getPublicBlog(slug: string): Promise<BlogRecord | null> {
  try {
    const ready = await blogCollectionReady();
    if (!ready) return staticBlog(slug);
    const doc = await BlogModel.findOne({ slug, status: "published" }).lean();
    if (!doc) return null;
    return {
      id: String(doc._id),
      slug: doc.slug,
      status: doc.status,
      author: doc.author || "Dr. Mona Dahiya",
      content: doc.content as BlogPostData,
      seo: asSeo(doc.seo),
    };
  } catch {
    return staticBlog(slug);
  }
}

const BLOG_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function blogDateValue(value: string) {
  const text = value.trim();
  const dayFirst = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  const monthFirst = text.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})$/);
  const day = Number(dayFirst?.[1] ?? monthFirst?.[2]);
  const monthName = dayFirst?.[2] ?? monthFirst?.[1] ?? "";
  const year = Number(dayFirst?.[3] ?? monthFirst?.[3]);
  const month = BLOG_MONTHS.indexOf(monthName.slice(0, 3).toLowerCase());
  if (month < 0 || !day || !year) return 0;
  return Date.UTC(year, month, day);
}

export async function getPublicBlogCards() {
  try {
    const ready = await blogCollectionReady();
    if (!ready) return null;
    const docs = await BlogModel.find({ status: "published" })
      .select("slug content.hero.title content.meta.date content.meta.tags")
      .lean();
    return docs
      .map((doc) => {
        const content = doc.content as BlogPostData;
        const href = `/blog/${doc.slug}`;
        const listed = BLOG_LISTING_ARTICLES.find((article) => article.href === href);
        return {
          topic: listed?.topic || content.meta?.tags?.[0] || "Fertility",
          title: listed?.title || content.hero?.title || content.metadata?.title || doc.slug,
          date: listed?.date || content.meta?.date || "",
          href,
        };
      })
      .sort((a, b) => blogDateValue(b.date) - blogDateValue(a.date));
  } catch {
    return null;
  }
}

export async function getPublicLocation(slug: string): Promise<LocationRecord | null> {
  try {
    await connection();
    await connectDb();
    const count = await LocationModel.estimatedDocumentCount();
    if (count === 0) return staticLocation(slug);
    const doc = await LocationModel.findOne({ slug, status: "published" }).lean();
    if (!doc) return null;
    return {
      id: String(doc._id),
      slug: doc.slug,
      status: doc.status,
      city: doc.city || "",
      region: doc.region || "",
      content: doc.content as LocationPageData,
      seo: asSeo(doc.seo),
    };
  } catch {
    return staticLocation(slug);
  }
}

export async function getPublicLocationCards() {
  try {
    await connection();
    await connectDb();
    const count = await LocationModel.estimatedDocumentCount();
    if (count === 0) return null;
    const docs = await LocationModel.find({ status: "published" })
      .select("slug city region areaGroup content.hero.title content.hero.highlightLocation")
      .sort({ updatedAt: -1 })
      .lean();
    return docs.map((doc) => {
      const content = doc.content as LocationPageData;
      return {
        slug: doc.slug as string,
        title: content.hero?.title || content.hero?.highlightLocation || (doc.slug as string),
        city: (doc.city as string) || "",
        region: (doc.region as string) || "",
        areaGroup: (doc.areaGroup as string) || "",
        href: `/location/${doc.slug}`,
      };
    });
  } catch {
    return null;
  }
}

export async function getPublishedBlogUpdates(): Promise<Map<string, Date> | null> {
  try {
    const ready = await blogCollectionReady();
    if (!ready) return null;
    const docs = await BlogModel.find({ status: "published" }).select("slug updatedAt").lean();
    return new Map(docs.map((doc) => [doc.slug as string, new Date(doc.updatedAt as string | Date)]));
  } catch {
    return null;
  }
}

export async function getPublishedLocationUpdates(): Promise<Map<string, Date> | null> {
  try {
    await connection();
    await connectDb();
    const count = await LocationModel.estimatedDocumentCount();
    if (count === 0) return null;
    const docs = await LocationModel.find({ status: "published" }).select("slug updatedAt").lean();
    return new Map(docs.map((doc) => [doc.slug as string, new Date(doc.updatedAt as string | Date)]));
  } catch {
    return null;
  }
}

export async function getPublishedLocationSlugs(): Promise<string[] | null> {
  try {
    await connection();
    await connectDb();
    const count = await LocationModel.estimatedDocumentCount();
    if (count === 0) return null;
    const docs = await LocationModel.find({ status: "published" }).select("slug").lean();
    return docs.map((doc) => doc.slug as string);
  } catch {
    return null;
  }
}

export async function getPreviewBlog(slug: string) {
  await connection();
  await connectDb();
  const doc = await BlogModel.findOne({ slug }).lean();
  if (!doc) return staticBlog(slug);
  return {
    content: doc.content as BlogPostData,
    seo: asSeo(doc.seo),
    status: doc.status as "draft" | "published",
  };
}

export async function getPreviewLocation(slug: string) {
  await connection();
  await connectDb();
  const doc = await LocationModel.findOne({ slug }).lean();
  if (!doc) return staticLocation(slug);
  return {
    content: doc.content as LocationPageData,
    seo: asSeo(doc.seo),
    status: doc.status as "draft" | "published",
  };
}
