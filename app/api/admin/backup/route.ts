import { connection } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/cms/http";
import { deriveLocationPlace } from "@/lib/cms/public";
import { assertSlug, assertStatus, normalizeSeo } from "@/lib/cms/validate";
import { connectDb } from "@/lib/db/mongoose";
import { BlogModel } from "@/lib/models/Blog";
import { LocationModel } from "@/lib/models/Location";
import type { BlogPostData } from "@/data/blogTypes";
import type { LocationPageData } from "@/data/locations";

export async function GET() {
  try {
    await connection();
    await requireAdmin();
    await connectDb();
    const blogs = await BlogModel.find().select("-__v").lean();
    const locations = await LocationModel.find().select("-__v").lean();
    const backup = {
      kind: "dr-mona-cms-backup",
      exportedAt: new Date().toISOString(),
      blogs: blogs.map((doc) => ({
        slug: doc.slug,
        status: doc.status,
        author: doc.author,
        content: doc.content,
        seo: doc.seo,
      })),
      locations: locations.map((doc) => ({
        slug: doc.slug,
        status: doc.status,
        city: doc.city,
        region: doc.region,
        content: doc.content,
        seo: doc.seo,
      })),
    };
    return new NextResponse(JSON.stringify(backup), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cms-backup-${backup.exportedAt.slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connection();
    await requireAdmin();
    await connectDb();
    const body = (await request.json()) as {
      kind?: string;
      blogs?: Array<{ slug?: string; status?: string; author?: string; content?: BlogPostData; seo?: unknown }>;
      locations?: Array<{ slug?: string; status?: string; city?: string; region?: string; content?: LocationPageData; seo?: unknown }>;
    };
    if (body.kind !== "dr-mona-cms-backup" || !Array.isArray(body.blogs) || !Array.isArray(body.locations)) {
      return NextResponse.json({ error: "That file is not a CMS backup." }, { status: 400 });
    }

    let blogs = 0;
    for (const item of body.blogs) {
      const content = item.content;
      const slug = String(item.slug || content?.slug || "").trim();
      assertSlug(slug);
      const status = assertStatus(String(item.status || "draft"));
      if (!content?.hero?.title) continue;
      content.slug = slug;
      await BlogModel.updateOne(
        { slug },
        { slug, status, author: String(item.author || "Dr. Mona Dahiya"), content, seo: normalizeSeo(item.seo) },
        { upsert: true },
      );
      blogs += 1;
    }

    let locations = 0;
    for (const item of body.locations) {
      const content = item.content;
      const slug = String(item.slug || content?.slug || "").trim();
      assertSlug(slug);
      const status = assertStatus(String(item.status || "draft"));
      if (!content?.hero?.title) continue;
      content.slug = slug;
      const place = deriveLocationPlace(content);
      await LocationModel.updateOne(
        { slug },
        {
          slug,
          status,
          city: item.city || place.city,
          region: item.region || place.region,
          content,
          seo: normalizeSeo(item.seo),
        },
        { upsert: true },
      );
      locations += 1;
    }

    return NextResponse.json({ blogs, locations });
  } catch (error) {
    return jsonError(error);
  }
}
