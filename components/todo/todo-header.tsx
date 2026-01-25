"use client";

import { useTodo } from "./todo-context";

export function TodoHeader() {
  const { viewMode, setViewMode } = useTodo();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-xl text-foreground font-bold tracking-tight uppercase font-display">
            Task_Manager_v2
          </h2>
          <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-1 border border-border">
          <button
            onClick={() => setViewMode("active")}
            className={`px-4 py-2 text-sm font-display uppercase tracking-wider transition-colors border-r border-border ${
              viewMode === "active"
                ? "bg-foreground text-background"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            Active Workspace
          </button>
          <button
            onClick={() => setViewMode("past")}
            className={`px-4 py-2 text-sm font-display uppercase tracking-wider transition-colors ${
              viewMode === "past"
                ? "bg-foreground text-background"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            Past Tasks
          </button>
        </div>
      </div>
    </header>
  );
}
