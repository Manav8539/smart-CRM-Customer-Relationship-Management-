"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contactSchema, type ContactInput } from "@/lib/validations";
import { api } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ContactFormDialog({
  open, onOpenChange, contact,
}: { open: boolean; onOpenChange: (o: boolean) => void; contact?: any }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(contact);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { status: "ACTIVE" },
  });

  useEffect(() => {
    if (open) reset(contact || { status: "ACTIVE" });
  }, [open, contact, reset]);

  const mutation = useMutation({
    mutationFn: (data: ContactInput) =>
      isEdit ? api.patch(`/api/contacts/${contact.id}`, data) : api.post("/api/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {mutation.isError && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
              {(mutation.error as Error).message}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input {...register("company")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input {...register("position")} />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input {...register("source")} placeholder="referral, website..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LEAD">Lead</option>
              <option value="CUSTOMER">Customer</option>
              <option value="CHURNED">Churned</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} {...register("notes")} />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Add contact"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
