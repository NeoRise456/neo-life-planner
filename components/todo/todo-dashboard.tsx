"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TodoProvider, useTodo } from "./todo-context";
import { ChronoSidebar } from "@/components/chrono/chrono-sidebar";
import { TodoHeader } from "./todo-header";
import { ActiveWorkspace } from "./active-workspace";
import { PastTasks } from "./past-tasks";
import { TaskInspector } from "./task-inspector";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

function TodoDashboardContent() {
  const { viewMode, isInspectorOpen } = useTodo();

  return (
    <SidebarProvider defaultOpen={true}>
      <ChronoSidebar />
      <SidebarInset className="min-h-screen bg-background flex flex-col">
        <TodoHeader />
        <main className="flex-1 overflow-hidden relative">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Main content */}
            <ResizablePanel defaultSize={80} minSize={30}>
              <div className="h-full">
                {viewMode === "active" ? <ActiveWorkspace /> : <PastTasks />}
              </div>
            </ResizablePanel>

            {/* Resizable handle */}
            {isInspectorOpen && (
              <ResizableHandle className="w-px bg-border hover:bg-foreground/50 transition-colors" />
            )}

            {/* Inspector panel */}
            {isInspectorOpen && (
              <ResizablePanel
                defaultSize={20}
                minSize={15}
                maxSize={40}
                collapsible
                collapsedSize={0}
              >
                <div className="h-full border-l border-border bg-sidebar">
                  <TaskInspector />
                </div>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function TodoDashboard() {
  return (
    <TodoProvider>
      <TodoDashboardContent />
    </TodoProvider>
  );
}
