"use client"

import { type ReactNode } from "react"
import { Plus } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useChrono } from "./chrono-context"
import { type DayOfWeek, DAY_FULL_LABELS, formatTime } from "./types"

interface TimeSlotContextMenuProps {
  children: ReactNode
  day: DayOfWeek
  hour: number
  minute?: number
}

export function TimeSlotContextMenu({
  children,
  day,
  hour,
  minute = 0,
}: TimeSlotContextMenuProps) {
  const { editMode, addScheduleCard, habits } = useChrono()

  if (editMode !== "edit") {
    return <>{children}</>
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 font-display">
        <ContextMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">
          {DAY_FULL_LABELS[day]} at {formatTime(hour, minute)}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuLabel className="text-xs">Add Schedule Card</ContextMenuLabel>
        {habits.map((habit) => (
          <ContextMenuItem
            key={habit._id}
            onClick={() => addScheduleCard(habit._id, day, hour, minute)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div
              className="w-3 h-3 flex-shrink-0"
              style={{ backgroundColor: habit.color }}
              aria-hidden="true"
            />
            <span className="truncate">{habit.name}</span>
            <Plus className="size-3 ml-auto text-muted-foreground" aria-hidden="true" />
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  )
}
