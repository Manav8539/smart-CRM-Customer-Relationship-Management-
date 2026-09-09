"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { Plus, Search, Pencil, Trash2, Download, Upload } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { api } from "@/lib/api-client";

const STATUS_VARIANT: Record<string, any> = {
  ACTIVE: "success", INACTIVE: "secondary", LEAD: "warning", CUSTOMER: "default", CHURNED: "destructive",
};

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", search, status],
    queryFn: () =>
      api.get<{ contacts: any[] }>(`/api/contacts?search=${encodeURIComponent(search)}&status=${status}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/contacts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });

  const exportCsv = () => {
    if (!data?.contacts?.length) return;
    const csv = Papa.unparse(
      data.contacts.map((c) => ({
        firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
        company: c.company, position: c.position, status: c.status,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        for (const row of results.data as any[]) {
          if (!row.firstName || !row.lastName || !row.email) continue;
          await api.post("/api/contacts", {
            firstName: row.firstName, lastName: row.lastName, email: row.email,
            phone: row.phone || undefined, company: row.company || undefined,
            position: row.position || undefined, status: row.status || "ACTIVE",
          }).catch(() => {});
        }
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
      },
    });
    e.target.value = "";
  };

  return (
    <div>
      <Topbar title="Contacts" />
      <main className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contacts..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LEAD">Lead</option>
              <option value="CUSTOMER">Customer</option>
              <option value="CHURNED">Churned</option>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4 mr-1" />Export</Button>
            <label>
              <input type="file" accept=".csv" className="hidden" onChange={importCsv} />
              <Button variant="outline" size="sm" asChild><span><Upload className="h-4 w-4 mr-1" />Import</span></Button>
            </label>
            <Button size="sm" onClick={() => { setEditingContact(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" />Add Contact
            </Button>
          </div>
        </div>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              )}
              {!isLoading && data?.contacts?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No contacts found.</td></tr>
              )}
              {data?.contacts?.map((c) => (
                <tr key={c.id} className="border-t hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${c.id}`} className="font-medium hover:underline">{c.firstName} {c.lastName}</Link>
                    <p className="text-xs text-muted-foreground">{c.position}</p>
                  </td>
                  <td className="px-4 py-3">{c.company || "-"}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge></td>
                  <td className="px-4 py-3">{c._count?.leads ?? 0}</td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingContact(c); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => confirm("Delete this contact?") && deleteMutation.mutate(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </main>

      <ContactFormDialog open={dialogOpen} onOpenChange={setDialogOpen} contact={editingContact} />
    </div>
  );
}
