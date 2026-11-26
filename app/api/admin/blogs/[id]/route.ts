import { NextResponse } from "next/server";
import type { BlogPostData } from "@/data/blogTypes";
import { requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/cms/http";
import { invalidateCmsCache } from "@/lib/cms/public";
import { assertSlug, assertStatus, normalizeSeo, withCanonical, withShareImage } from "@/lib/cms/validate";
import { connectDb } from "@/lib/db/mongoose";
import { BlogModel } from "@/lib/models/Blog";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    await connectDb();
    const { id } = await context.params;
    const doc = await BlogModel.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: String(doc._id),
      slug: doc.slug,
      status: doc.status,
      author: doc.author,
      content: doc.content,
      seo: doc.seo,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    await connectDb();
    const { id } = await context.params;
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
    const clash = await BlogModel.exists({ slug, _id: { $ne: id } });
    if (clash) return NextResponse.json({ error: `A blog with this slug already exists: ${slug}` }, { status: 409 });
    const seo = withShareImage(withCanonical(normalizeSeo(body.seo), `/blog/${slug}`), content.meta?.image?.src);
    content.slug = slug;
    content.metadata = {
      title: seo.metaTitle || content.metadata?.title || content.hero.title,
      description: seo.metaDescription || content.metadata?.description || "",
    };
    const doc = await BlogModel.findByIdAndUpdate(
      id,
      { slug, status, author: String(body.author || "Dr. Mona Dahiya"), content, seo },
      { new: true },
    );
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    invalidateCmsCache();
    return NextResponse.json({ id: String(doc._id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    await connectDb();
    const { id } = await context.params;
    const doc = await BlogModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    invalidateCmsCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
