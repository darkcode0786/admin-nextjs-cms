import { createHash } from "crypto";
import { readFileSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import mongoose from "mongoose";

for (const line of readFileSync(".env.local", "utf8").split(/\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;
const uploadDir = path.resolve(process.cwd(), "public/uploads/blogs");
const cache = new Map();

async function downloadImage(url) {
  const cached = cache.get(url);
  if (cached) return cached;
  const response = await fetch(url);
  if (!response.ok) {
    console.warn("skip", response.status, url);
    cache.set(url, url);
    return url;
  }
  const extMatch = url.match(/\.(png|jpe?g|webp|gif|avif)/i);
  const ext = (extMatch?.[1] || "jpg").toLowerCase().replace("jpeg", "jpg");
  const name = `${createHash("sha1").update(url).digest("hex").slice(0, 16)}.${ext}`;
  await writeFile(path.join(uploadDir, name), Buffer.from(await response.arrayBuffer()));
  const local = `/uploads/blogs/${name}`;
  cache.set(url, local);
  console.log("saved", local);
  return local;
}

async function localize(value) {
  if (typeof value === "string" && /^https?:\/\//i.test(value) && IMAGE_EXT.test(value)) {
    return downloadImage(value);
  }
  if (Array.isArray(value)) {
    const next = [];
    for (const item of value) next.push(await localize(item));
    return next;
  }
  if (value && typeof value === "object") {
    const next = {};
    for (const [key, item] of Object.entries(value)) {
      next[key] = await localize(item);
    }
    return next;
  }
  return value;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await mkdir(uploadDir, { recursive: true });
  const db = mongoose.connection.db;
  const blogs = db.collection("blogs");
  const ids = await blogs.find({}, { projection: { _id: 1, slug: 1 } }).toArray();
  for (const row of ids) {
    const doc = await blogs.findOne({ _id: row._id });
    if (!doc) continue;
    const content = await localize(doc.content);
    const seo = await localize(doc.seo);
    await blogs.updateOne({ _id: row._id }, { $set: { content, seo } });
    console.log("blog", row.slug);
  }
  const locations = db.collection("locations");
  const locationIds = await locations.find({}, { projection: { _id: 1, slug: 1 } }).toArray();
  for (const row of locationIds) {
    const doc = await locations.findOne({ _id: row._id });
    if (!doc) continue;
    const content = await localize(doc.content);
    const seo = await localize(doc.seo);
    await locations.updateOne({ _id: row._id }, { $set: { content, seo } });
  }
  console.log("images", [...cache.values()].filter((value) => value.startsWith("/uploads/")).length);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
