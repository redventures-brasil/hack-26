import { NextResponse } from "next/server";
import { JUDGE_COOKIE, JUDGE_EMAIL_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(JUDGE_COOKIE);
  res.cookies.delete(JUDGE_EMAIL_COOKIE);
  return res;
}
