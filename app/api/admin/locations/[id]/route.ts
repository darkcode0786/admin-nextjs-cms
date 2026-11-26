import { NextResponse } from "next/server";
import type { LocationPageData } from "@/data/locations";
import { requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/cms/http";
import { deriveLocationPlace } from "@/lib/cms/public";
import { assertSlug, assertStatus, normalizeSeo, withCanonical, withShareImage } from "@/lib/cms/validate";
import { connectDb } from "@/lib/db/mongoose";
import { LocationModel } from "@/lib/models/Location";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    await connectDb();
    const { id } = await context.params;
    const doc = await LocationModel.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: String(doc._id),
      slug: doc.slug,
      status: doc.status,
      city: doc.city,
      region: doc.region,
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
    const content = body.content as LocationPageData;
    const slug = String(body.slug || content?.slug || "").trim();
    assertSlug(slug);
    const status = assertStatus(String(body.status || "draft"));
    if (!content?.hero?.title?.trim()) {
      return NextResponse.json({ error: "Location title is required" }, { status: 400 });
    }
    const clash = await LocationModel.exists({ slug, _id: { $ne: id } });
    if (clash) return NextResponse.json({ error: `A location with this slug already exists: ${slug}` }, { status: 409 });
    const seo = withShareImage(withCanonical(normalizeSeo(body.seo), `/location/${slug}`), content.hero?.image);
    content.slug = slug;
    content.metadata = {
      title: seo.metaTitle || content.metadata?.title || content.hero.title,
      description: seo.metaDescription || content.metadata?.description || "",
    };
    const place = deriveLocationPlace(content);
    const doc = await LocationModel.findByIdAndUpdate(
      id,
      { slug, status, city: place.city, region: place.region, content, seo },
      { new: true },
    );
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    const doc = await LocationModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
