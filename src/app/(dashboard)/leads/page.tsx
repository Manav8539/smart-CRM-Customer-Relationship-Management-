"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { api } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

const STATUS_VARIANT: Record<string, any> = {
  NEW: "secondary", CONTACTED: "default", QUALIFIED: "default", PROPOSAL: "warning",
  NEGOTIATION: "warning", CONVERTED: "success", LOST: "destructive",
};

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [scoringId, setScoringId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["leads", status],
    queryFn: () => api.get<{ leads: any[] }>(`/api/leads?status=${status}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/leads/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const scoreLead = async (id: string) => {
    setScoringId(id);
    try {
      await api.post("/api/ai/score-lead", { leadId: id });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } finally {
      setScoringId(null);
    }
  };

  return (
    <div>
      <Topbar title="Leads" />
      <main className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
            <option value="">All statuses</option>
            {["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CONVERTED", "LOST"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <Button size="sm" onClick={() => { setEditingLead(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />Add Lead
          </Button>
        </div>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">AI Score</th>
                <th className="px-4 py-3 font-medium">Assigned</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>}
              {!isLoading && data?.leads?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No leads found.</td></tr>
              )}
              {data?.leads?.map((l) => (
                <tr key={l.id} className="border-t hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${l.id}`} className="font-medium hover:underline">{l.title}</Link>
                  </td>
                  <td className="px-4 py-3">{l.contact?.firstName} {l.contact?.lastName}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[l.status]}>{l.status}</Badge></td>
                  <td className="px-4 py-3">{formatCurrency(l.value)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{Math.round(l.score ?? 0)}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={scoringId === l.id} onClick={() => scoreLead(l.id)} title="Re-score with AI">
                        <Sparkles className={`h-3.5 w-3.5 ${scoringId === l.id ? "animate-pulse" : ""}`} />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">{l.assignedToUser?.firstName} {l.assignedToUser?.lastName}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingLead(l); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirm("Delete this lead?") && deleteMutation.mutate(l.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </main>

      <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} lead={editingLead} />
    </div>
  );
}
