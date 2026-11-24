import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/cms/http";
import { connectDb } from "@/lib/db/mongoose";
import { BlogModel } from "@/lib/models/Blog";
import { LocationModel } from "@/lib/models/Location";

export async function GET() {
  try {
    await requireAdmin();
    await connectDb();
    const [blogs, publishedBlogs, locations, publishedLocations] = await Promise.all([
      BlogModel.countDocuments(),
      BlogModel.countDocuments({ status: "published" }),
      LocationModel.countDocuments(),
      LocationModel.countDocuments({ status: "published" }),
    ]);
    return NextResponse.json({
      blogs,
      publishedBlogs,
      draftBlogs: blogs - publishedBlogs,
      locations,
      publishedLocations,
      draftLocations: locations - publishedLocations,
    });
  } catch (error) {
    return jsonError(error);
  }
}
