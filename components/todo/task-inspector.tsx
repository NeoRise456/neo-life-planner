"use client";

import { useCallback, useState, useEffect } from "react";
import { Trash2, Repeat, Save, X, Check } from "lucide-react";
import { useTodo } from "./todo-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function TaskInspector() {
  const { selectedTaskId, closeInspector, updateTask, terminateTask, deleteTask } = useTodo();
  const selectedTask = useQuery(api.tasks.getTaskById, { taskId: selectedTaskId! });

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recurrence, setRecurrence] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const handleReset = useCallback(() => {
    if (selectedTask && !isEditing) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || "");
      setRecurrence(selectedTask.recurrence || undefined);
      setPriority(selectedTask.priority || undefined);
      setTags(selectedTask.tags || []);
    }
  }, [selectedTask, isEditing]);

  useEffect(() => {
    handleReset();
  }, [handleReset]);

  const handleSave = useCallback(async () => {
    if (!selectedTask) return;
    await updateTask({
      taskId: selectedTask._id,
      title: title.trim() || selectedTask.title,
      description: description.trim() || undefined,
      recurrence,
      priority,
      tags: tags.length > 0 ? tags : undefined,
    });
    setIsEditing(false);
  }, [selectedTask, title, description, recurrence, priority, tags, updateTask]);

  const handleCancel = useCallback(() => {
    if (selectedTask) {
      setTitle(selectedTask.title);
      setDescription(selectedTask.description || "");
      setRecurrence(selectedTask.recurrence || undefined);
      setPriority(selectedTask.priority || undefined);
      setTags(selectedTask.tags || []);
    }
    setIsEditing(false);
  }, [selectedTask]);

  const handleAddTag = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (newTag.trim() && !tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
        setNewTag("");
      }
    },
    [newTag, tags]
  );

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  }, [tags]);

  const isCompleted = selectedTask?.status === "completed" || selectedTask?.isTerminated;
  const isPastTask = isCompleted;

  if (!selectedTask) {
    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-border flex-shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
            Task Inspector
          </p>
          <h4 className="text-sm font-bold text-foreground font-display">
            No Task Selected
          </h4>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground font-display text-center">
            Select a task to view details
          </p>
        </div>
      </div>
    );
  }

  const completedDate = selectedTask.completedAt
    ? new Date(selectedTask.completedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const createdDate = new Date(selectedTask.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
            {isPastTask ? "Past Task" : "Active Task"}
          </p>
          <h4 className="text-sm font-bold text-foreground font-display truncate">
            {selectedTask.title}
          </h4>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={closeInspector}
          className="flex-shrink-0"
          aria-label="Close inspector"
        >
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Completed timestamp for past tasks */}
          {isPastTask && completedDate && (
            <div className="p-4 border border-border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Check className="size-4 text-foreground" />
                <p className="text-sm font-bold text-foreground font-display">
                  Completed
                </p>
              </div>
              <p className="text-xs text-muted-foreground font-display">
                {completedDate}
              </p>
            </div>
          )}

          {/* Task Details */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              {isEditing && !isPastTask ? (
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground font-display uppercase">
                    Title
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-display text-sm"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-muted-foreground font-display uppercase mb-1">
                    Title
                  </p>
                  <p className="text-sm font-medium text-foreground font-display">
                    {selectedTask.title}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              {isEditing && !isPastTask ? (
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground font-display uppercase">
                    Description
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="font-display text-sm resize-none h-24"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-muted-foreground font-display uppercase mb-1">
                    Description
                  </p>
                  <p className="text-sm text-muted-foreground font-display">
                    {selectedTask.description || "No description"}
                  </p>
                </div>
              )}
            </div>

            {/* Recurrence (for active tasks) */}
            {!isPastTask && (
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground font-display uppercase">
                      Recurrence
                    </Label>
                    <Select value={recurrence} onValueChange={setRecurrence}>
                      <SelectTrigger className="font-display text-sm">
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No recurrence</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] text-muted-foreground font-display uppercase mb-1">
                      Recurrence
                    </p>
                    <div className="flex items-center gap-2">
                      {selectedTask.recurrence ? (
                        <>
                          <Repeat className="size-4 text-foreground" />
                          <span className="text-sm text-foreground font-display capitalize">
                            {selectedTask.recurrence}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground font-display">
                          No recurrence
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Priority */}
            <div>
              {isEditing && !isPastTask ? (
                <div className="space-y-2">
                  <Label className="text-[10px] text-muted-foreground font-display uppercase">
                    Priority
                  </Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="font-display text-sm">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-muted-foreground font-display uppercase mb-1">
                    Priority
                  </p>
                  <div className="flex items-center gap-2">
                    {selectedTask.priority ? (
                      <Badge className="font-display text-xs uppercase">
                        {selectedTask.priority}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground font-display">
                        No priority
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <p className="text-[10px] text-muted-foreground font-display uppercase mb-2">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? tags : selectedTask.tags)?.map((tag) => (
                  <Badge key={tag} className="font-display text-xs uppercase">
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                    {tag}
                  </Badge>
                ))}
                {isEditing && !isPastTask && (
                  <form onSubmit={handleAddTag} className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      className="font-display text-sm h-6 w-24"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs"
                    >
                      Add
                    </Button>
                  </form>
                )}
              </div>
              {(!isEditing && !selectedTask.tags?.length) && (
                <p className="text-xs text-muted-foreground font-display">
                  No tags
                </p>
              )}
            </div>

            {/* Created Date */}
            <div>
              <p className="text-[10px] text-muted-foreground font-display uppercase mb-1">
                Created
              </p>
              <p className="text-sm text-muted-foreground font-display">
                {createdDate}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border space-y-2">
              {!isPastTask && isEditing && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} className="flex-1 font-display">
                    <Save className="size-3 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 font-display"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {!isPastTask && !isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="w-full font-display"
                >
                  Edit Task
                </Button>
              )}

              {!isPastTask && selectedTask.recurrence && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => terminateTask(selectedTask._id)}
                  className="w-full font-display text-destructive hover:bg-destructive/10"
                >
                  <Repeat className="size-3 mr-2" />
                  Stop Recurrence
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteTask(selectedTask._id)}
                className="w-full font-display text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3 mr-2" />
                {isPastTask ? "Delete Forever" : "Delete Task"}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
