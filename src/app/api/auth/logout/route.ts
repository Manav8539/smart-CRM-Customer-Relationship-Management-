import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token ? verifyAccessToken(token) : null;

  if (payload) {
    await prisma.user.update({ where: { id: payload.userId }, data: { refreshToken: null } }).catch(() => {});
  }

  const res = NextResponse.json({ message: "Logged out" });
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
