"use client"

import { useCallback, useRef } from "react"
import { Pencil, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useChrono } from "./chrono-context"
import { ScheduleCard } from "./schedule-card"
import { TimeSlotContextMenu } from "./time-slot-context-menu"
import {
  type DayOfWeek,
  DAYS_OF_WEEK,
  DAY_LABELS,
  SCHEDULE_CONFIG,
  getTimeSlots,
  formatTime,
} from "./types"

const timeSlots = getTimeSlots()

function TimeColumn() {
  return (
    <div className="w-16 shrink-0 border-r border-border">
      <div className="h-10 border-b border-border bg-muted/30" />
      {timeSlots.map((hour) => (
        <div
          key={hour}
          className="border-b border-border relative"
          style={{ height: `${SCHEDULE_CONFIG.SLOT_HEIGHT_PX}px` }}
        >
          <span className="absolute -top-2.5 left-2 text-[10px] text-muted-foreground tabular-nums font-display">
            {formatTime(hour, 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface DayColumnProps {
  day: DayOfWeek
}

function DayColumn({ day }: DayColumnProps) {
  const { editMode, selectedCardId, getCardsForDay, addScheduleCard } = useChrono()
  const columnRef = useRef<HTMLDivElement>(null)
  const cards = getCardsForDay(day)
  const isToday = new Date().getDay() === (day + 1) % 7 // JS: 0 = Sunday

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()

      const habitId = e.dataTransfer.getData("habitId")
      if (!habitId || !columnRef.current) return

      const rect = columnRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const totalMinutes = SCHEDULE_CONFIG.START_HOUR * 60 + (y / SCHEDULE_CONFIG.SLOT_HEIGHT_PX) * 60
      const hour = Math.floor(totalMinutes / 60)
      const minute = totalMinutes % 60 >= 30 ? 30 : 0

      addScheduleCard(habitId, day, hour, minute)
    },
    [day, addScheduleCard]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  return (
    <div
      ref={columnRef}
      className={cn(
        "flex-1 min-w-0 border-r border-border last:border-r-0 relative",
        editMode === "edit" && "hover:bg-accent/30 transition-colors"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Day header */}
      <div
        className={cn(
          "h-10 border-b border-border flex items-center justify-center sticky top-0 z-10",
          isToday ? "bg-foreground text-background" : "bg-muted/30"
        )}
      >
        <span className="text-xs font-bold tracking-widest font-display">
          {DAY_LABELS[day]}
        </span>
      </div>

      {/* Time slots */}
      <div className="relative">
        {timeSlots.map((hour) => (
          <TimeSlotContextMenu key={hour} day={day} hour={hour}>
            <div
              className={cn(
                "border-b border-border transition-colors",
                editMode === "edit" && "hover:bg-accent/50"
              )}
              style={{ height: `${SCHEDULE_CONFIG.SLOT_HEIGHT_PX}px` }}
            >
              {/* Half-hour marker */}
              <div
                className="border-b border-dashed border-border/50"
                style={{ height: `${SCHEDULE_CONFIG.SLOT_HEIGHT_PX / 2}px` }}
              />
            </div>
          </TimeSlotContextMenu>
        ))}

        {/* Schedule cards */}
        {cards.map((card) => (
          <ScheduleCard
            key={card._id}
            card={card}
            isSelected={selectedCardId === card._id}
          />
        ))}
      </div>
    </div>
  )
}

interface TimetableProps {
  onEditModeChange?: (isEditing: boolean) => void
}

export function Timetable({ onEditModeChange }: TimetableProps) {
  const { editMode, toggleEditMode } = useChrono()
  const isEditing = editMode === "edit"

  const handleEditToggle = useCallback(() => {
    const newEditState = !isEditing
    toggleEditMode()
    onEditModeChange?.(newEditState)
  }, [isEditing, toggleEditMode, onEditModeChange])

  return (
    <div className="flex-1 flex flex-col bg-card tech-border min-h-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5 font-display">
            Chrono System
          </p>
          <h3 className="text-base font-bold text-foreground font-display">
            Weekly Timetable
          </h3>
        </div>
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={handleEditToggle}
          className="font-display gap-1.5"
        >
          {isEditing ? (
            <>
              <Check className="size-3.5" aria-hidden="true" />
              Done
            </>
          ) : (
            <>
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit Schedule
            </>
          )}
        </Button>
      </div>

      {/* Timetable grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex" data-timetable>
          <TimeColumn />
          {DAYS_OF_WEEK.map((day) => (
            <DayColumn key={day} day={day} />
          ))}
        </div>
      </div>
    </div>
  )
}
