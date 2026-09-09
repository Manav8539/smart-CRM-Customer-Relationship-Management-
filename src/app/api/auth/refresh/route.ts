import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, verifyRefreshToken } from "@/lib/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json({ error: "Session expired, please log in again" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshToken !== refreshToken) {
    return NextResponse.json({ error: "Session expired, please log in again" }, { status: 401 });
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  const res = NextResponse.json({ message: "Token refreshed" });
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...cookieOptions, maxAge: 60 * 15 });
  return res;
}
