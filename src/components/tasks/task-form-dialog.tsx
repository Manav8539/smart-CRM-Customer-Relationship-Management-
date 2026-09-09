"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { taskSchema, type TaskInput } from "@/lib/validations";
import { api } from "@/lib/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function TaskFormDialog({ open, onOpenChange, task }: { open: boolean; onOpenChange: (o: boolean) => void; task?: any }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(task);

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<{ users: any[] }>("/api/users"),
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: { priority: "MEDIUM", status: "PENDING" },
  });

  useEffect(() => {
    if (open) {
      reset(task ? { ...task, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : undefined } : { priority: "MEDIUM", status: "PENDING" });
    }
  }, [open, task, reset]);

  const mutation = useMutation({
    mutationFn: (data: TaskInput) => (isEdit ? api.patch(`/api/tasks/${task.id}`, data) : api.post("/api/tasks", data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Edit Task" : "Create Task"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {mutation.isError && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
              {(mutation.error as Error).message}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={2} {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select {...register("priority")}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" {...register("dueDate")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assign to</Label>
            <Select {...register("assignedTo")}>
              <option value="">Select user</option>
              {usersData?.users?.map((u) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
            </Select>
            {errors.assignedTo && <p className="text-xs text-destructive">{errors.assignedTo.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Create task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
