import { NextResponse } from "next/server";
import {
  JUDGE_COOKIE,
  JUDGE_COOKIE_MAX_AGE,
  JUDGE_COOKIE_VALUE,
  checkPassword,
} from "@/lib/auth";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = (await req.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: JUDGE_COOKIE,
    value: JUDGE_COOKIE_VALUE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: JUDGE_COOKIE_MAX_AGE,
  });
  return res;
}
