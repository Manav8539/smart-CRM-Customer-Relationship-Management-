"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { api } from "@/lib/api-client";
import { formatDate, cn } from "@/lib/utils";

const TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
];

const PRIORITY_VARIANT: Record<string, any> = { HIGH: "destructive", MEDIUM: "warning", LOW: "secondary" };

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", tab],
    queryFn: () => api.get<{ tasks: any[] }>(`/api/tasks?status=${tab}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tasks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/api/tasks/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const cycleStatus = (task: any) => {
    const next = task.status === "PENDING" ? "IN_PROGRESS" : task.status === "IN_PROGRESS" ? "COMPLETED" : "PENDING";
    statusMutation.mutate({ id: task.id, status: next });
  };

  return (
    <div>
      <Topbar title="Tasks" />
      <main className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 bg-secondary/60 p-1 rounded-lg">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={cn("px-3 py-1.5 text-sm rounded-md font-medium", tab === t.value ? "bg-white shadow-sm" : "text-muted-foreground")}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setEditingTask(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />Create Task
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
          {!isLoading && data?.tasks?.length === 0 && <p className="text-sm text-muted-foreground">No tasks found.</p>}
          {data?.tasks?.map((task) => (
            <Card key={task.id} className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button onClick={() => cycleStatus(task)} className="mt-0.5 shrink-0">
                  {task.status === "COMPLETED" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className={cn("font-medium truncate", task.status === "COMPLETED" && "line-through text-muted-foreground")}>{task.title}</p>
                  {task.description && <p className="text-sm text-muted-foreground truncate">{task.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
                    <Badge variant="outline">{task.status.replace("_", " ")}</Badge>
                    {task.dueDate && <span className="text-xs text-muted-foreground">Due {formatDate(task.dueDate)}</span>}
                    {task.assignedToUser && (
                      <span className="text-xs text-muted-foreground">
                        Assigned to {task.assignedToUser.firstName} {task.assignedToUser.lastName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => { setEditingTask(task); setDialogOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => confirm("Delete this task?") && deleteMutation.mutate(task.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <TaskFormDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editingTask} />
    </div>
  );
}
