"use client";

import { createContext, useContext, useCallback, ReactNode, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type ViewMode = "active" | "past";

interface TodoState {
  viewMode: ViewMode;
  selectedTaskId: Id<"tasks"> | null;
  isInspectorOpen: boolean;
}

interface TodoContextType extends TodoState {
  setViewMode: (mode: ViewMode) => void;
  selectTask: (taskId: Id<"tasks"> | null) => void;
  openInspector: () => void;
  closeInspector: () => void;
  createTask: (args: {
    title: string;
    description?: string;
    recurrence?: string;
    dueDate?: number;
    tags?: string[];
    priority?: string;
  }) => Promise<Id<"tasks"> | undefined>;
  updateTask: (args: {
    taskId: Id<"tasks">;
    title?: string;
    description?: string;
    recurrence?: string;
    dueDate?: number;
    tags?: string[];
    priority?: string;
  }) => Promise<void>;
  completeTask: (taskId: Id<"tasks">) => Promise<void>;
  terminateTask: (taskId: Id<"tasks">) => Promise<void>;
  deleteTask: (taskId: Id<"tasks">) => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export function useTodo() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error("useTodo must be used within TodoProvider");
  }
  return context;
}

interface TodoProviderProps {
  children: ReactNode;
}

export function TodoProvider({ children }: TodoProviderProps) {
  const [state, setState] = useState<TodoState>({
    viewMode: "active",
    selectedTaskId: null,
    isInspectorOpen: false,
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const selectTask = useCallback((taskId: Id<"tasks"> | null) => {
    setState((prev) => ({
      ...prev,
      selectedTaskId: taskId,
      isInspectorOpen: taskId !== null,
    }));
  }, []);

  const openInspector = useCallback(() => {
    setState((prev) => ({ ...prev, isInspectorOpen: true }));
  }, []);

  const closeInspector = useCallback(() => {
    setState((prev) => ({ ...prev, isInspectorOpen: false, selectedTaskId: null }));
  }, []);

  const createTaskMutation = useMutation(api.tasks.createTask);
  const updateTaskMutation = useMutation(api.tasks.updateTask);
  const completeTaskMutation = useMutation(api.tasks.completeTask);
  const terminateTaskMutation = useMutation(api.tasks.terminateTask);
  const deleteTaskMutation = useMutation(api.tasks.deleteTask);

  const createTask = useCallback(
    async (args: {
      title: string;
      description?: string;
      recurrence?: string;
      dueDate?: number;
      tags?: string[];
      priority?: string;
    }) => {
      return await createTaskMutation(args);
    },
    [createTaskMutation]
  );

  const updateTask = useCallback(
    async (args: {
      taskId: Id<"tasks">;
      title?: string;
      description?: string;
      recurrence?: string;
      dueDate?: number;
      tags?: string[];
      priority?: string;
    }) => {
      await updateTaskMutation(args);
    },
    [updateTaskMutation]
  );

  const completeTask = useCallback(
    async (taskId: Id<"tasks">) => {
      await completeTaskMutation({ taskId });
    },
    [completeTaskMutation]
  );

  const terminateTask = useCallback(
    async (taskId: Id<"tasks">) => {
      await terminateTaskMutation({ taskId });
    },
    [terminateTaskMutation]
  );

  const deleteTask = useCallback(
    async (taskId: Id<"tasks">) => {
      await deleteTaskMutation({ taskId });
    },
    [deleteTaskMutation]
  );

  return (
    <TodoContext.Provider
      value={{
        ...state,
        setViewMode,
        selectTask,
        openInspector,
        closeInspector,
        createTask,
        updateTask,
        completeTask,
        terminateTask,
        deleteTask,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
}
