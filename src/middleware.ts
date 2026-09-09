import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/cookies";

const PROTECTED_PREFIXES = ["/dashboard", "/contacts", "/leads", "/pipeline", "/tasks", "/profile"];
const AUTH_PAGES = ["/login", "/signup", "/forgot-password"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  const payload = accessToken ? verifyAccessToken(accessToken) : null;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !payload) {
    // Still have a refresh token — let the client-side query layer try to
    // silently refresh before bouncing to login (handled by the fetch
    // wrapper on 401). Otherwise, redirect immediately.
    if (!refreshToken) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAuthPage && payload) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/contacts/:path*", "/leads/:path*", "/pipeline/:path*", "/tasks/:path*", "/profile/:path*", "/login", "/signup", "/forgot-password"],
};
