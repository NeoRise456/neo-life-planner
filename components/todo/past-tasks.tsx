"use client";

import { useTodo } from "./todo-context";
import { TaskCard } from "./task-card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PastTasks() {
  const { deleteTask } = useTodo();
  const pastTasks = useQuery(api.tasks.getPastTasks) ?? [];

  const sortedTasks = [...pastTasks].sort((a, b) => {
    const aDate = a.completedAt ?? a.createdAt;
    const bDate = b.completedAt ?? b.createdAt;
    return bDate - aDate;
  });

  if (sortedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-muted-foreground font-display mb-2">No past tasks yet</p>
          <p className="text-xs text-muted-foreground font-display">
            Completed tasks will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold uppercase tracking-widest font-display text-foreground">
            Past Tasks
          </h3>
          <span className="text-xs text-muted-foreground font-display">
            {sortedTasks.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-display">
          Completed & terminated tasks
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {sortedTasks.map((task) => {
            const completedDate = task.completedAt
              ? new Date(task.completedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : null;

            return (
              <div
                key={task._id}
                className="group flex items-center gap-4 p-4 border border-border opacity-50 hover:opacity-70 transition-all"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <TaskCard
                    id={task._id}
                    title={task.title}
                    description={task.description}
                    status={task.status as "active" | "completed" | "terminated"}
                    recurrence={task.recurrence}
                    dueDate={task.dueDate}
                    completedAt={task.completedAt}
                    tags={task.tags}
                    priority={task.priority}
                    isPastTask
                  />
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {completedDate && (
                    <p className="text-[10px] text-muted-foreground font-display">
                      Finished: {completedDate}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteTask(task._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete forever"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
