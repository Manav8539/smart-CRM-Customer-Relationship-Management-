"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, Building2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { formatCurrency, formatDate, initials } from "@/lib/utils";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: () => api.get<{ contact: any }>(`/api/contacts/${id}`),
  });

  if (isLoading) return <div className="p-6">Loading...</div>;
  const contact = data?.contact;
  if (!contact) return <div className="p-6">Contact not found.</div>;

  return (
    <div>
      <Topbar title="Contact Details" />
      <main className="p-4 md:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/contacts")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to contacts
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary grid place-items-center text-xl font-semibold mx-auto mb-3">
                {initials(contact.firstName, contact.lastName)}
              </div>
              <h2 className="text-lg font-semibold">{contact.firstName} {contact.lastName}</h2>
              <p className="text-sm text-muted-foreground">{contact.position} {contact.company ? `at ${contact.company}` : ""}</p>
              <Badge className="mt-2">{contact.status}</Badge>
              <div className="mt-5 space-y-2 text-sm text-left">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {contact.email}</p>
                {contact.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {contact.phone}</p>}
                {contact.company && <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> {contact.company}</p>}
              </div>
              {contact.notes && (
                <div className="mt-4 text-left">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{contact.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader><CardTitle>Leads ({contact.leads?.length ?? 0})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {contact.leads?.length ? contact.leads.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{l.title}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(l.value)}</p>
                    </div>
                    <Badge variant="secondary">{l.status}</Badge>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No leads yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Activity History</CardTitle></CardHeader>
              <CardContent>
                {contact.activities?.length ? (
                  <ul className="space-y-3">
                    {contact.activities.map((a: any) => (
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
        </div>
      </main>
    </div>
  );
}
