import { NextResponse } from "next/server";
import {
  JUDGE_COOKIE,
  JUDGE_COOKIE_MAX_AGE,
  JUDGE_COOKIE_VALUE,
  JUDGE_EMAIL_COOKIE,
  checkPassword,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth";

export async function POST(req: Request) {
  let email = "";
  let password = "";
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    email = body.email ?? "";
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, reason: "email" }, { status: 400 });
  }
  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false, reason: "password" }, { status: 401 });
  }

  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: JUDGE_COOKIE_MAX_AGE,
  };
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: JUDGE_COOKIE,
    value: JUDGE_COOKIE_VALUE,
    ...cookieOpts,
  });
  res.cookies.set({
    name: JUDGE_EMAIL_COOKIE,
    value: normalizeEmail(email),
    ...cookieOpts,
  });
  return res;
}
