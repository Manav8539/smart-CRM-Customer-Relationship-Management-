import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { leadSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const leads = await prisma.lead.findMany({
    where: status ? { status: status as any } : {},
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true, company: true } },
      assignedToUser: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: { ...parsed.data, userId: user.id },
    include: { contact: true, assignedToUser: { select: { firstName: true, lastName: true } } },
  });

  await prisma.activity.create({
    data: { type: "SYSTEM", description: `Lead "${lead.title}" created`, userId: user.id, leadId: lead.id },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
