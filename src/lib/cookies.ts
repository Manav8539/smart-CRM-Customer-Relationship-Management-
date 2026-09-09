// Kept separate from lib/auth.ts (which imports Prisma) so this file can be
// safely imported from Edge-runtime code such as middleware.ts.
export const ACCESS_COOKIE = "smartcrm_access_token";
export const REFRESH_COOKIE = "smartcrm_refresh_token";

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
