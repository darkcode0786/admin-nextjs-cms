import { NextResponse } from "next/server";
import type { BlogPostData } from "@/data/blogTypes";
import { requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/cms/http";
import { invalidateCmsCache } from "@/lib/cms/public";
import { seoIsComplete } from "@/lib/cms/types";
import { assertSlug, assertStatus, normalizeSeo, readPage, withCanonical, withShareImage } from "@/lib/cms/validate";
import { connectDb } from "@/lib/db/mongoose";
import { BlogModel } from "@/lib/models/Blog";

function summary(doc: {
  _id: unknown;
  slug: string;
  status: string;
  author?: string;
  content: BlogPostData;
  seo?: { metaTitle?: string; metaDescription?: string };
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    slug: doc.slug,
    status: doc.status,
    author: doc.author || "Dr. Mona Dahiya",
    title: doc.content?.hero?.title || doc.slug,
    category: doc.content?.meta?.tags?.[0] || "",
    image: doc.content?.meta?.image?.src || "",
    seoStatus: seoIsComplete(doc.seo) ? "complete" : "missing",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    await connectDb();
    const { page, pageSize, searchParams } = readPage(request.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const category = searchParams.get("category")?.trim();
    const filter: Record<string, unknown> = {};
    if (status === "draft" || status === "published") filter.status = status;
    if (category) filter["content.meta.tags"] = category;
    if (q) {
      filter.$or = [
        { slug: { $regex: q, $options: "i" } },
        { "content.hero.title": { $regex: q, $options: "i" } },
      ];
    }
    const [total, docs, categories] = await Promise.all([
      BlogModel.countDocuments(filter),
      BlogModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      BlogModel.distinct("content.meta.tags.0"),
    ]);
    return NextResponse.json({
      items: docs.map((doc) => summary(doc as never)),
      total,
      page,
      pageSize,
      categories: (categories as string[]).filter(Boolean).sort(),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    await connectDb();
    const body = await request.json();
    const content = body.content as BlogPostData;
    const slug = String(body.slug || content?.slug || "").trim();
    assertSlug(slug);
    const status = assertStatus(String(body.status || "draft"));
    if (!content?.hero?.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!Array.isArray(content.sections)) {
      return NextResponse.json({ error: "Sections must be an array" }, { status: 400 });
    }
    const exists = await BlogModel.exists({ slug });
    if (exists) {
      return NextResponse.json({ error: "Slug is already in use" }, { status: 409 });
    }
    const seo = withShareImage(withCanonical(normalizeSeo(body.seo), `/blog/${slug}`), content.meta?.image?.src);
    content.slug = slug;
    if (seo.metaTitle) content.metadata = { ...content.metadata, title: seo.metaTitle };
    if (seo.metaDescription) {
      content.metadata = { ...content.metadata, description: seo.metaDescription };
    }
    const doc = await BlogModel.create({
      slug,
      status,
      author: String(body.author || "Dr. Mona Dahiya"),
      content,
      seo,
    });
    invalidateCmsCache();
    return NextResponse.json({ id: String(doc._id) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
