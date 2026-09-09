"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { api } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

const COLUMNS = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "CONVERTED", "LOST"];
const COLUMN_COLOR: Record<string, string> = {
  NEW: "border-t-slate-400", CONTACTED: "border-t-indigo-400", QUALIFIED: "border-t-sky-400",
  PROPOSAL: "border-t-amber-400", NEGOTIATION: "border-t-orange-400", CONVERTED: "border-t-emerald-400", LOST: "border-t-red-400",
};

export default function PipelinePage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<string>("NEW");

  const { data, isLoading } = useQuery({
    queryKey: ["leads", ""],
    queryFn: () => api.get<{ leads: any[] }>("/api/leads?status="),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/api/leads/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    moveMutation.mutate({ id: draggableId, status: destination.droppableId });
  };

  const leadsByStatus = (status: string) => data?.leads?.filter((l) => l.status === status) || [];

  return (
    <div>
      <Topbar title="Sales Pipeline" />
      <main className="p-4 md:p-6">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading pipeline...</p>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((status) => (
                <Droppable droppableId={status} key={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`w-72 shrink-0 rounded-lg bg-secondary/40 border-t-4 ${COLUMN_COLOR[status]} p-3 kanban-column`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">{status.replace("_", " ")}</h3>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary">{leadsByStatus(status).length}</Badge>
                          <Button
                            variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => { setDefaultStatus(status); setDialogOpen(true); }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 min-h-[60px] max-h-[65vh] overflow-y-auto pr-1">
                        {leadsByStatus(status).map((lead, index) => (
                          <Draggable draggableId={lead.id} index={index} key={lead.id}>
                            {(dragProvided) => (
                              <Card
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                              >
                                <p className="text-sm font-medium">{lead.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{lead.contact?.firstName} {lead.contact?.lastName}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs font-semibold text-primary">{formatCurrency(lead.value)}</span>
                                  <span className="text-xs text-muted-foreground">{lead.probability ?? 0}%</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">{lead.assignedToUser?.firstName} {lead.assignedToUser?.lastName}</p>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </main>

      <LeadFormDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultStatus={defaultStatus} />
    </div>
  );
}
