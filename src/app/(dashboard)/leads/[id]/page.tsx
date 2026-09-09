"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Wand2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["lead", id],
    queryFn: () => api.get<{ lead: any }>(`/api/leads/${id}`),
  });

  const scoreMutation = useMutation({
    mutationFn: () => api.post<{ score: number; reasoning: string }>("/api/ai/score-lead", { leadId: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lead", id] }),
  });

  const getRecommendations = async () => {
    setLoadingAction("recommend");
    try {
      const res = await api.post<{ recommendations: string[] }>("/api/ai/recommend", { leadId: id });
      setRecommendations(res.recommendations);
    } finally {
      setLoadingAction(null);
    }
  };

  const generateEmail = async () => {
    setLoadingAction("email");
    try {
      const lead = data?.lead;
      const res = await api.post<{ email: string }>("/api/ai/generate-email", {
        purpose: "follow up on this opportunity and move it to the next stage",
        recipientName: `${lead?.contact?.firstName ?? ""} ${lead?.contact?.lastName ?? ""}`,
        context: lead?.title,
        tone: "professional",
      });
      setEmailDraft(res.email);
    } finally {
      setLoadingAction(null);
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  const lead = data?.lead;
  if (!lead) return <div className="p-6">Lead not found.</div>;

  return (
    <div>
      <Topbar title="Lead Details" />
      <main className="p-4 md:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/leads")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to leads
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{lead.title}</CardTitle>
                  <Badge>{lead.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{lead.description || "No description provided."}</p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div><p className="text-xs text-muted-foreground">Value</p><p className="font-medium">{formatCurrency(lead.value)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Probability</p><p className="font-medium">{lead.probability ?? 0}%</p></div>
                  <div><p className="text-xs text-muted-foreground">Contact</p><p className="font-medium">{lead.contact?.firstName} {lead.contact?.lastName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Assigned to</p><p className="font-medium">{lead.assignedToUser?.firstName} {lead.assignedToUser?.lastName}</p></div>
                </div>
                {lead.notes && <div><p className="text-xs text-muted-foreground">Notes</p><p>{lead.notes}</p></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
              <CardContent>
                {lead.activities?.length ? (
                  <ul className="space-y-3">
                    {lead.activities.map((a: any) => (
                      <li key={a.id} className="text-sm border-l-2 border-primary/40 pl-3">
                        <p>{a.description}</p>
                        <p className="text-xs text-muted-foreground">{a.user?.firstName} {a.user?.lastName} · {formatDate(a.date)}</p>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Lead Score</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-bold">{Math.round(scoreMutation.data?.score ?? lead.score ?? 0)}<span className="text-sm text-muted-foreground font-normal">/100</span></div>
                {scoreMutation.data?.reasoning && <p className="text-xs text-muted-foreground">{scoreMutation.data.reasoning}</p>}
                <Button size="sm" variant="outline" className="w-full" disabled={scoreMutation.isPending} onClick={() => scoreMutation.mutate()}>
                  {scoreMutation.isPending ? "Scoring..." : "Re-score with AI"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4" /> Smart Recommendations</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {recommendations ? (
                  <ul className="list-disc pl-4 text-sm space-y-1">{recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                ) : <p className="text-sm text-muted-foreground">Get AI-suggested next actions for this lead.</p>}
                <Button size="sm" variant="outline" className="w-full" disabled={loadingAction === "recommend"} onClick={getRecommendations}>
                  {loadingAction === "recommend" ? "Thinking..." : "Suggest next actions"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Email Generator</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {emailDraft && <pre className="whitespace-pre-wrap text-xs bg-secondary/60 rounded-md p-3">{emailDraft}</pre>}
                <Button size="sm" variant="outline" className="w-full" disabled={loadingAction === "email"} onClick={generateEmail}>
                  {loadingAction === "email" ? "Drafting..." : "Generate follow-up email"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
