import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import type { StorageAdapter, UploadInput } from "./types";

const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

function uploadRoot() {
  const configured = process.env.UPLOAD_DIR || "public/uploads";
  return path.resolve(process.cwd(), configured);
}

function publicBase() {
  const base = process.env.UPLOAD_PUBLIC_BASE || "/uploads";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function assertInsideRoot(target: string) {
  const root = uploadRoot();
  const resolved = path.resolve(target);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Invalid upload path");
  }
  return resolved;
}

export const localStorageAdapter: StorageAdapter = {
  async upload(input: UploadInput) {
    const ext = ALLOWED.get(input.mimeType);
    if (!ext) {
      throw new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
    }
    if (input.buffer.length > MAX_BYTES) {
      throw new Error("Image must be 5 MB or smaller");
    }
    if (!["blogs", "locations", "general"].includes(input.folder)) {
      throw new Error("Invalid upload folder");
    }

    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
    const directory = assertInsideRoot(path.join(uploadRoot(), input.folder));
    await mkdir(directory, { recursive: true });
    const absolute = assertInsideRoot(path.join(directory, filename));
    await writeFile(absolute, input.buffer);
    const url = `${publicBase()}/${input.folder}/${filename}`;
    return { path: url, url };
  },

  async delete(publicPath: string) {
    if (!publicPath || !publicPath.startsWith(`${publicBase()}/`)) return;
    const relative = publicPath.slice(publicBase().length + 1);
    if (relative.includes("..") || path.isAbsolute(relative)) {
      throw new Error("Invalid file path");
    }
    const absolute = assertInsideRoot(path.join(uploadRoot(), relative));
    await unlink(absolute).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  },
};
