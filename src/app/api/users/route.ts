import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Lightweight list used to populate "assign to" dropdowns.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
    orderBy: { firstName: "asc" },
  });

  return NextResponse.json({ users });
}
