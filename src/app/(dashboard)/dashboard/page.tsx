"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Target, TrendingUp, DollarSign, Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  NEW: "#6366f1", CONTACTED: "#8b5cf6", QUALIFIED: "#0ea5e9", PROPOSAL: "#f59e0b",
  NEGOTIATION: "#f97316", CONVERTED: "#10b981", LOST: "#ef4444",
};

interface DashboardData {
  stats: { totalContacts: number; activeLeads: number; conversionRate: number; revenue: number };
  leadsByStatus: { status: string; count: number }[];
  revenueTrend: { month: string; revenue: number }[];
  recentActivity: any[];
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/api/dashboard"),
  });

  return (
    <div>
      <Topbar title="Dashboard" />
      <main className="p-4 md:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">Here is what is happening across your pipeline today.</p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline"><Link href="/contacts"><Plus className="h-4 w-4 mr-1" />Add Contact</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/leads"><Plus className="h-4 w-4 mr-1" />Add Lead</Link></Button>
            <Button asChild size="sm"><Link href="/tasks"><Plus className="h-4 w-4 mr-1" />Create Task</Link></Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Contacts" value={isLoading ? "-" : String(data?.stats.totalContacts ?? 0)} icon={Users} accent="bg-indigo-100 text-indigo-600" />
          <StatCard title="Active Leads" value={isLoading ? "-" : String(data?.stats.activeLeads ?? 0)} icon={Target} accent="bg-sky-100 text-sky-600" />
          <StatCard title="Conversion Rate" value={isLoading ? "-" : `${data?.stats.conversionRate ?? 0}%`} icon={TrendingUp} accent="bg-emerald-100 text-emerald-600" />
          <StatCard title="Revenue" value={isLoading ? "-" : formatCurrency(data?.stats.revenue)} icon={DollarSign} accent="bg-amber-100 text-amber-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Lead Status Distribution</CardTitle></CardHeader>
            <CardContent className="h-72">
              {data?.leadsByStatus?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.leadsByStatus} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {data.leadsByStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-sm text-muted-foreground">No leads yet</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.revenueTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(245 58% 51%)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {data?.recentActivity?.length ? (
              <ul className="space-y-4">
                {data.recentActivity.map((a: any) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p>
                        <span className="font-medium">{a.user?.firstName} {a.user?.lastName}</span> — {a.description}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
