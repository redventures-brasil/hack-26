import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";

export const runtime = "nodejs";

const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_VIDEO = new Set(["video/mp4", "video/quicktime"]);
const ALLOWED_IMAGE = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

/**
 * Multipart upload. Saves to `public/uploads/{kind}/{rand}-{filename}` and
 * returns the public URL.
 *
 * Local stub for Vercel Blob — same shape (POST a file, get back a URL).
 * Swap in `put()` from `@vercel/blob` when deploying.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }
  const file = form.get("file");
  const kindRaw = (form.get("kind") as string | null) ?? "image";
  const kind = kindRaw === "video" ? "video" : "image";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: "too_large", maxBytes }, { status: 413 });
  }

  const allowed = kind === "video" ? ALLOWED_VIDEO : ALLOWED_IMAGE;
  if (!allowed.has(file.type)) {
    return NextResponse.json(
      { error: "unsupported_type", got: file.type },
      { status: 415 },
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", kind);
  await fs.mkdir(dir, { recursive: true });

  const rand = Math.random().toString(36).slice(2, 10);
  const filename = `${rand}-${safeName(file.name)}`;
  const filePath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const url = `/uploads/${kind}/${filename}`;
  return NextResponse.json({ url, size: file.size, type: file.type });
}
