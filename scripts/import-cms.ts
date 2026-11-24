import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { seedCmsFromStatic } from "../lib/cms/seed";
import { connectDb } from "../lib/db/mongoose";
import { BlogModel } from "../lib/models/Blog";
import { LocationModel } from "../lib/models/Location";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;
const uploadDir = path.resolve(process.cwd(), "public/uploads/blogs");

async function downloadImage(url: string, cache: Map<string, string>) {
  const cached = cache.get(url);
  if (cached) return cached;
  const response = await fetch(url);
  if (!response.ok) {
    console.warn("skip", response.status, url);
    cache.set(url, url);
    return url;
  }
  const extMatch = url.match(IMAGE_EXT);
  const ext = extMatch ? extMatch[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
  const name = `${createHash("sha1").update(url).digest("hex").slice(0, 16)}.${ext.startsWith(".") ? ext.slice(1) : ext}`;
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(uploadDir, name), bytes);
  const local = `/uploads/blogs/${name}`;
  cache.set(url, local);
  console.log("saved", local);
  return local;
}

async function localize(value: unknown, cache: Map<string, string>): Promise<unknown> {
  if (typeof value === "string" && /^https?:\/\//i.test(value) && IMAGE_EXT.test(value)) {
    return downloadImage(value, cache);
  }
  if (Array.isArray(value)) {
    const next = [];
    for (const item of value) next.push(await localize(item, cache));
    return next;
  }
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      next[key] = await localize(item, cache);
    }
    return next;
  }
  return value;
}

async function main() {
  const result = await seedCmsFromStatic();
  console.log("seed", result);
  await connectDb();
  await mkdir(uploadDir, { recursive: true });
  const cache = new Map<string, string>();

  const blogIds = await BlogModel.find().select("_id slug").lean();
  for (const row of blogIds) {
    const blog = await BlogModel.findById(row._id);
    if (!blog) continue;
    blog.content = await localize(blog.content, cache);
    blog.seo = await localize(blog.seo, cache);
    blog.markModified("content");
    blog.markModified("seo");
    await blog.save();
    console.log("blog", row.slug);
  }

  const locationIds = await LocationModel.find().select("_id slug").lean();
  for (const row of locationIds) {
    const location = await LocationModel.findById(row._id);
    if (!location) continue;
    location.content = await localize(location.content, cache);
    location.seo = await localize(location.seo, cache);
    location.markModified("content");
    location.markModified("seo");
    await location.save();
  }

  console.log("done", {
    blogs: blogIds.length,
    locations: locationIds.length,
    images: [...cache.values()].filter((value) => value.startsWith("/uploads/")).length,
  });
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
