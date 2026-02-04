"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useHabitsContext } from "./habits-provider"
import { formatDisplayDate } from "./utils"

export function HabitsHeader() {
  const { selectedDate, navigateDate, isToday, canGoBack, canGoForward, openAddSheet } = useHabitsContext()

  const goToday = () => {
    navigateDate(0)
  }

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-6">
        <SidebarTrigger />
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold font-display tracking-tight">
            HABIT TRACKER
          </h1>
          <div className="flex items-center gap-2 border-l border-border pl-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate(-1)}
              disabled={!canGoBack}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Previous day"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <button
              onClick={goToday}
              className="text-sm font-display uppercase tracking-wider text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-accent transition-colors"
            >
              {isToday ? "Today" : formatDisplayDate(selectedDate)}
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateDate(1)}
              disabled={!canGoForward}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Next day"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <Button onClick={openAddSheet} className="h-9 px-4">
        <Plus className="size-4 mr-2" />
        Add Habit
      </Button>
    </header>
  )
}
