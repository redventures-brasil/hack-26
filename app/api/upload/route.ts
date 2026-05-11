import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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

declare global {
  var __hack26_s3: S3Client | undefined;
}

function s3(): S3Client {
  if (globalThis.__hack26_s3) return globalThis.__hack26_s3;
  const region =
    process.env.AWS_REGION_OVERRIDE || process.env.AWS_REGION || "sa-east-1";
  const client = new S3Client({ region });
  globalThis.__hack26_s3 = client;
  return client;
}

/**
 * Multipart upload. In production stores under
 * `s3://${UPLOAD_BUCKET}/static/uploads/{kind}/{rand}-{filename}` and returns
 * the CloudFront URL (UPLOAD_URL_PREFIX + key tail). Locally falls back to
 * writing into `public/uploads/{kind}/` so `npm run dev` still works without
 * any AWS creds.
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

  const rand = Math.random().toString(36).slice(2, 10);
  const filename = `${rand}-${safeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const bucket = process.env.UPLOAD_BUCKET;
  if (bucket) {
    const key = `static/uploads/${kind}/${filename}`;
    await s3().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const prefix =
      process.env.UPLOAD_URL_PREFIX?.replace(/\/$/, "") ?? "/static/uploads";
    const url = `${prefix}/${kind}/${filename}`;
    return NextResponse.json({ url, size: file.size, type: file.type });
  }

  // Local dev fallback — writes to public/uploads, served by Next directly.
  const dir = path.join(process.cwd(), "public", "uploads", kind);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return NextResponse.json({
    url: `/uploads/${kind}/${filename}`,
    size: file.size,
    type: file.type,
  });
}
