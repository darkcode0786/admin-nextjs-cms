import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { jsonError } from "@/lib/cms/http";
import { getStorage } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "general");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image file" }, { status: 400 });
    }
    if (folder !== "blogs" && folder !== "locations" && folder !== "general") {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }
    const stored = await getStorage().upload({
      buffer: Buffer.from(await file.arrayBuffer()),
      originalName: file.name,
      mimeType: file.type,
      folder,
    });
    return NextResponse.json(stored);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as { path?: string };
    if (!body.path) {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }
    await getStorage().delete(body.path);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
