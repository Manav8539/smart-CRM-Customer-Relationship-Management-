"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leadSchema, type LeadInput } from "@/lib/validations";
import { api } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CONVERTED", "LOST"];

export function LeadFormDialog({
  open, onOpenChange, lead, defaultStatus,
}: { open: boolean; onOpenChange: (o: boolean) => void; lead?: any; defaultStatus?: string }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(lead);

  const { data: contactsData } = useQuery({
    queryKey: ["contacts", "", ""],
    queryFn: () => api.get<{ contacts: any[] }>("/api/contacts?search=&status="),
    enabled: open,
  });
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<{ users: any[] }>("/api/users"),
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { status: (defaultStatus as any) || "NEW" },
  });

  useEffect(() => {
    if (open) reset(lead || { status: (defaultStatus as any) || "NEW" });
  }, [open, lead, defaultStatus, reset]);

  const mutation = useMutation({
    mutationFn: (data: LeadInput) => (isEdit ? api.patch(`/api/leads/${lead.id}`, data) : api.post("/api/leads", data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Edit Lead" : "Add Lead"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {mutation.isError && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
              {(mutation.error as Error).message}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...register("title")} placeholder="Enterprise plan upgrade" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Select {...register("contactId")}>
              <option value="">Select a contact</option>
              {contactsData?.contacts?.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName} {c.company ? `(${c.company})` : ""}</option>
              ))}
            </Select>
            {errors.contactId && <p className="text-xs text-destructive">{errors.contactId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select {...register("status")}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select {...register("assignedTo")}>
                <option value="">Select user</option>
                {usersData?.users?.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </Select>
              {errors.assignedTo && <p className="text-xs text-destructive">{errors.assignedTo.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Value ($)</Label>
              <Input type="number" step="0.01" {...register("value")} />
            </div>
            <div className="space-y-1.5">
              <Label>Probability (%)</Label>
              <Input type="number" min={0} max={100} {...register("probability")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Input {...register("source")} placeholder="referral, website, event..." />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={2} {...register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} {...register("notes")} />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Add lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
