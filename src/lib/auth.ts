import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { verifyAccessToken } from "./jwt";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
} from "./cookies";

export {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
};

/**
 * Reads the access-token cookie from an incoming request, validates it,
 * and returns the current user (without the password hash) or null.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) return null;

  const {
    password: _password,
    verificationToken,
    resetToken,
    refreshToken,
    ...safeUser
  } = user;

  return safeUser;
}

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}