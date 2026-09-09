import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { leadSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      contact: true,
      assignedToUser: { select: { id: true, firstName: true, lastName: true } },
      tasks: true,
      activities: { orderBy: { date: "desc" }, include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = leadSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const previous = await prisma.lead.findUnique({ where: { id: params.id } });
  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: parsed.data,
    include: { contact: true, assignedToUser: { select: { firstName: true, lastName: true } } },
  });

  if (previous && parsed.data.status && previous.status !== parsed.data.status) {
    await prisma.activity.create({
      data: {
        type: "SYSTEM",
        description: `Lead moved from ${previous.status} to ${parsed.data.status}`,
        userId: user.id,
        leadId: lead.id,
      },
    });
  }

  return NextResponse.json({ lead });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Lead deleted" });
}
