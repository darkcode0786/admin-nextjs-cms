import { NextResponse } from "next/server";
import { LOCATION_PAGES, type LocationPageData } from "@/data/locations";
import { requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/cms/http";
import { deriveLocationPlace } from "@/lib/cms/public";
import { seoIsComplete } from "@/lib/cms/types";
import { assertSlug, assertStatus, normalizeSeo, readPage, withCanonical, withShareImage } from "@/lib/cms/validate";
import { connectDb } from "@/lib/db/mongoose";
import { LocationModel } from "@/lib/models/Location";

function summary(doc: {
  _id: unknown;
  slug: string;
  status: string;
  city?: string;
  region?: string;
  content: LocationPageData;
  seo?: { metaTitle?: string; metaDescription?: string };
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(doc._id),
    slug: doc.slug,
    status: doc.status,
    name: doc.content?.hero?.title || doc.slug,
    city: doc.city || "",
    region: doc.region || "",
    image: doc.content?.hero?.image || "",
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
    const filter: Record<string, unknown> = {};
    if (status === "draft" || status === "published") filter.status = status;
    if (q) {
      filter.$or = [
        { slug: { $regex: q, $options: "i" } },
        { city: { $regex: q, $options: "i" } },
        { "content.hero.title": { $regex: q, $options: "i" } },
      ];
    }
    const [total, docs] = await Promise.all([
      LocationModel.countDocuments(filter),
      LocationModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);
    return NextResponse.json({
      items: docs.map((doc) => summary(doc as never)),
      total,
      page,
      pageSize,
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
    const content = body.content as LocationPageData;
    const slug = String(body.slug || content?.slug || "").trim();
    assertSlug(slug);
    const status = assertStatus(String(body.status || "draft"));
    if (!content?.hero?.title?.trim()) {
      return NextResponse.json({ error: "Location title is required" }, { status: 400 });
    }
    const exists = await LocationModel.exists({ slug });
    const staticExists = LOCATION_PAGES.some((page) => page.slug === slug);
    if (exists || staticExists) {
      return NextResponse.json({ error: `A location with this slug already exists: ${slug}` }, { status: 409 });
    }
    const seo = withShareImage(withCanonical(normalizeSeo(body.seo), `/location/${slug}`), content.hero?.image);
    content.slug = slug;
    content.metadata = {
      title: seo.metaTitle || content.metadata?.title || content.hero.title,
      description: seo.metaDescription || content.metadata?.description || "",
    };
    const place = deriveLocationPlace(content);
    const doc = await LocationModel.create({
      slug,
      status,
      city: place.city,
      region: place.region,
      content,
      seo,
    });
    return NextResponse.json({ id: String(doc._id) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
