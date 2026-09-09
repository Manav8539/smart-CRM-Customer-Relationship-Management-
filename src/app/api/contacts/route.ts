import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { contactSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");

  const contacts = await prisma.contact.findMany({
    where: {
      AND: [
        status ? { status: status as any } : {},
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    include: { _count: { select: { leads: true, activities: true, tasks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const contact = await prisma.contact.create({
    data: { ...parsed.data, userId: user.id },
  });

  await prisma.activity.create({
    data: {
      type: "SYSTEM",
      description: `Contact ${contact.firstName} ${contact.lastName} created`,
      userId: user.id,
      contactId: contact.id,
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
