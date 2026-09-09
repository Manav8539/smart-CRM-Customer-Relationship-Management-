import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [totalContacts, activeLeads, convertedLeads, totalLeads, revenueAgg, statusGroups, recentActivity] =
    await Promise.all([
      prisma.contact.count(),
      prisma.lead.count({ where: { status: { notIn: ["CONVERTED", "LOST"] } } }),
      prisma.lead.count({ where: { status: "CONVERTED" } }),
      prisma.lead.count(),
      prisma.lead.aggregate({ where: { status: "CONVERTED" }, _sum: { value: true } }),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.activity.findMany({
        take: 8,
        orderBy: { date: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true } },
          contact: { select: { firstName: true, lastName: true } },
          lead: { select: { title: true } },
        },
      }),
    ]);

  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;

  // Revenue trend for the last 6 months, based on converted lead value.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const recentConverted = await prisma.lead.findMany({
    where: { status: "CONVERTED", updatedAt: { gte: sixMonthsAgo } },
    select: { value: true, updatedAt: true },
  });

  const monthly: Record<string, number> = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = d.toLocaleString("en-US", { month: "short" });
    monthly[key] = 0;
  }
  for (const lead of recentConverted) {
    const key = new Date(lead.updatedAt).toLocaleString("en-US", { month: "short" });
    if (key in monthly) monthly[key] += lead.value || 0;
  }

  return NextResponse.json({
    stats: {
      totalContacts,
      activeLeads,
      conversionRate,
      revenue: revenueAgg._sum.value || 0,
    },
    leadsByStatus: statusGroups.map((g) => ({ status: g.status, count: g._count._all })),
    revenueTrend: Object.entries(monthly).map(([month, revenue]) => ({ month, revenue })),
    recentActivity,
  });
}
