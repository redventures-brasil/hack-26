import { NextResponse } from "next/server";
import { z } from "zod";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

const Body = z.object({
  kind: z.enum(["video", "image"]),
  filename: z.string().min(1).max(120),
  contentType: z.string().min(1).max(100),
  size: z.number().int().min(1).max(MAX_VIDEO_BYTES),
});

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

declare global {
  var __hack26_s3_presign: S3Client | undefined;
}

function s3(): S3Client {
  if (globalThis.__hack26_s3_presign) return globalThis.__hack26_s3_presign;
  const region =
    process.env.AWS_REGION_OVERRIDE || process.env.AWS_REGION || "sa-east-1";
  const client = new S3Client({ region });
  globalThis.__hack26_s3_presign = client;
  return client;
}

/**
 * Returns a short-lived presigned PUT URL the browser can use to upload a
 * file directly to S3 — bypasses the API Gateway 10 MB request limit that
 * was killing video uploads. The publicUrl is the CloudFront-fronted URL
 * the client should persist as the screenshot/video reference.
 *
 * Auth: anyone can call this. Mitigations: key is unguessable (random),
 * content-type + size are validated, allowed-MIME whitelist matches the
 * legacy /api/upload, and the bucket policy + CORS restrict downstream
 * access. A malicious caller can upload arbitrary objects under
 * `static/uploads/{kind}/...` but they're all read-only, served via
 * CloudFront, and isolated from the rest of the bucket.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { kind, filename, contentType, size } = parsed.data;

  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (size > maxBytes) {
    return NextResponse.json({ error: "too_large", maxBytes }, { status: 413 });
  }
  const allowed = kind === "video" ? ALLOWED_VIDEO : ALLOWED_IMAGE;
  if (!allowed.has(contentType)) {
    return NextResponse.json(
      { error: "unsupported_type", got: contentType },
      { status: 415 },
    );
  }

  const bucket = process.env.UPLOAD_BUCKET;
  if (!bucket) {
    return NextResponse.json(
      { error: "upload_bucket_not_configured" },
      { status: 500 },
    );
  }

  const rand = Math.random().toString(36).slice(2, 10);
  const key = `static/uploads/${kind}/${rand}-${safeName(filename)}`;

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });
  const uploadUrl = await getSignedUrl(s3(), cmd, { expiresIn: 300 });

  const prefix =
    process.env.UPLOAD_URL_PREFIX?.replace(/\/$/, "") ?? "/static/uploads";
  const tail = key.replace(/^static\/uploads\//, "");
  const publicUrl = `${prefix}/${tail}`;

  return NextResponse.json({
    uploadUrl,
    publicUrl,
    expiresIn: 300,
  });
}
