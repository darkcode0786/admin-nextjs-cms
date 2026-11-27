import { createHash } from "crypto";
import { readFileSync } from "fs";
import { access, mkdir, writeFile } from "fs/promises";
import path from "path";
import { replaceCmsFromStatic } from "../lib/cms/seed";
import { connectDb } from "../lib/db/mongoose";
import { BlogModel } from "../lib/models/Blog";
import { LocationModel } from "../lib/models/Location";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;
const IMAGE_IN_TEXT = /https?:\/\/[^\s"'<>]+?\.(?:png|jpe?g|webp|gif|avif)(?:\?[^\s"'<>]*)?/gi;

function loadEnvFile(file: string) {
  try {
    const text = readFileSync(path.resolve(process.cwd(), file), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // The shell may already have the variables.
  }
}

loadEnvFile(".env.local");

async function downloadImage(url: string, folder: "blogs" | "locations", cache: Map<string, string>) {
  const key = `${folder}:${url}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const extMatch = url.match(IMAGE_EXT);
  const ext = extMatch ? extMatch[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
  const cleanExt = ext.startsWith(".") ? ext.slice(1) : ext;
  const name = `${createHash("sha1").update(url).digest("hex").slice(0, 16)}.${cleanExt}`;
  const uploadDir = path.resolve(process.cwd(), "public/uploads", folder);
  await mkdir(uploadDir, { recursive: true });
  const local = `/uploads/${folder}/${name}`;
  const filePath = path.join(uploadDir, name);
  try {
    await access(filePath);
    cache.set(key, local);
    return local;
  } catch {
    // Download when the file is not already on disk.
  }
  const response = await fetch(url);
  if (!response.ok) {
    console.warn("skip", response.status, url);
    cache.set(key, url);
    return url;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, bytes);
  cache.set(key, local);
  console.log("saved", local);
  return local;
}

async function localize(value: unknown, folder: "blogs" | "locations", cache: Map<string, string>): Promise<unknown> {
  if (typeof value === "string") {
    if (value.startsWith("/uploads/")) return value;
    if (/^https?:\/\//i.test(value) && IMAGE_EXT.test(value)) {
      return downloadImage(value, folder, cache);
    }
    if (IMAGE_IN_TEXT.test(value)) {
      IMAGE_IN_TEXT.lastIndex = 0;
      const urls = [...new Set(value.match(IMAGE_IN_TEXT) ?? [])];
      let next = value;
      for (const url of urls) {
        const local = await downloadImage(url, folder, cache);
        if (local !== url) next = next.split(url).join(local);
      }
      return next;
    }
    return value;
  }
  if (Array.isArray(value)) {
    const next = [];
    for (const item of value) next.push(await localize(item, folder, cache));
    return next;
  }
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      next[key] = await localize(item, folder, cache);
    }
    return next;
  }
  return value;
}

async function main() {
  const result = await replaceCmsFromStatic();
  console.log("replace", result);
  await connectDb();
  const cache = new Map<string, string>();

  let blogCount = 0;
  for await (const row of BlogModel.find().select("slug content seo").lean().cursor()) {
    const content = await localize(row.content, "blogs", cache);
    const seo = await localize(row.seo, "blogs", cache);
    await BlogModel.updateOne({ _id: row._id }, { $set: { content, seo } });
    blogCount += 1;
    console.log("blog", row.slug);
  }

  let locationCount = 0;
  for await (const row of LocationModel.find().select("slug content seo").lean().cursor()) {
    const content = await localize(row.content, "locations", cache);
    const seo = await localize(row.seo, "locations", cache);
    await LocationModel.updateOne({ _id: row._id }, { $set: { content, seo } });
    locationCount += 1;
    console.log("location", row.slug);
  }

  console.log("done", {
    blogs: blogCount,
    locations: locationCount,
    images: [...cache.values()].filter((value) => value.startsWith("/uploads/")).length,
  });
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
