import { NextResponse, type NextRequest } from "next/server";
import { JUDGE_COOKIE, JUDGE_COOKIE_VALUE } from "@/lib/auth";

// Protect everything under /judge/* except the login screen itself.
// API routes also pass through this matcher so the login handler is
// reachable even when not authenticated.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // login screen + login API: always allow
  if (pathname === "/judge/login") return NextResponse.next();
  if (pathname.startsWith("/api/judge/")) return NextResponse.next();

  // anything else under /judge: gate by cookie
  if (pathname === "/judge" || pathname.startsWith("/judge/")) {
    const cookie = req.cookies.get(JUDGE_COOKIE);
    if (cookie?.value !== JUDGE_COOKIE_VALUE) {
      const url = req.nextUrl.clone();
      url.pathname = "/judge/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/judge", "/judge/:path*", "/api/judge/:path*"],
};
