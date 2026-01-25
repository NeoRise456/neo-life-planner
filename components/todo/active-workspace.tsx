"use client";

import { useCallback, useState, KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { useTodo } from "./todo-context";
import { TaskCard } from "./task-card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ActiveWorkspace() {
  const { createTask } = useTodo();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const routineTasks = useQuery(api.tasks.getRoutineTasks) ?? [];
  const inboxTasks = useQuery(api.tasks.getInboxTasks) ?? [];

  const handleCreateTask = useCallback(
    async (e: KeyboardEvent<HTMLInputElement> | React.FormEvent) => {
      e.preventDefault();
      if (!newTaskTitle.trim()) return;

      await createTask({
        title: newTaskTitle.trim(),
      });

      setNewTaskTitle("");
    },
    [newTaskTitle, createTask]
  );

  return (
    <div className="flex gap-4 h-full">
      {/* Routine Column */}
      <div className="flex-1 flex flex-col border-r border-border min-w-0">
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest font-display text-foreground">
              The Routine
            </h3>
            <span className="text-xs text-muted-foreground font-display">
              {routineTasks.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-display">
            Recurring habits & tasks
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {routineTasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-muted-foreground font-display">
                No recurring tasks yet
              </div>
            ) : (
              routineTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  id={task._id}
                  title={task.title}
                  description={task.description}
                  status={task.status as "active" | "completed" | "terminated"}
                  recurrence={task.recurrence}
                  dueDate={task.dueDate}
                  tags={task.tags}
                  priority={task.priority}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Inbox Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest font-display text-foreground">
              The Inbox
            </h3>
            <span className="text-xs text-muted-foreground font-display">
              {inboxTasks.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-display">
            One-off tasks
          </p>
        </div>

        <div className="px-6 py-3 flex-shrink-0">
          <form onSubmit={handleCreateTask} className="flex items-center gap-3 bg-zinc-900/30 p-3 border border-border hover:border-muted-foreground/50 transition-colors group">
            <Plus className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <Input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateTask(e);
              }}
              placeholder="ADD_NEW_TASK [PRESS ENTER]"
              className="bg-transparent border-none focus:ring-0 text-foreground placeholder-muted-foreground font-display h-auto text-sm w-full"
            />
          </form>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {inboxTasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-muted-foreground font-display">
                Inbox is empty
              </div>
            ) : (
              inboxTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  id={task._id}
                  title={task.title}
                  description={task.description}
                  status={task.status as "active" | "completed" | "terminated"}
                  dueDate={task.dueDate}
                  tags={task.tags}
                  priority={task.priority}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
