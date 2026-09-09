import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") || 10);

  const activities = await prisma.activity.findMany({
    take: limit,
    orderBy: { date: "desc" },
    include: {
      user: { select: { firstName: true, lastName: true } },
      contact: { select: { firstName: true, lastName: true } },
      lead: { select: { title: true } },
    },
  });

  return NextResponse.json({ activities });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const activity = await prisma.activity.create({
    data: {
      type: body.type,
      description: body.description,
      userId: user.id,
      contactId: body.contactId || undefined,
      leadId: body.leadId || undefined,
    },
  });

  return NextResponse.json({ activity }, { status: 201 });
}
