"use client"

import { useRef, useCallback, useMemo, type MouseEvent, type KeyboardEvent } from "react"
import { X, GripVertical, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useChrono } from "./chrono-context"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { formatDate, getDayOfWeek } from "@/components/habits/utils"
import {
  type ScheduleCard as ScheduleCardType,
  type DayOfWeek,
  SCHEDULE_CONFIG,
  formatTime,
  formatDuration,
  getCardEndTime,
  clampDuration,
} from "./types"

interface ScheduleCardProps {
  card: ScheduleCardType
  isSelected: boolean
}

export function ScheduleCard({ card, isSelected }: ScheduleCardProps) {
  const { state, selectCard, deleteScheduleCard } = useChrono()
  const cardRef = useRef<HTMLDivElement>(null)
  
  const habit = useQuery(api.habits.getHabitById, { id: card.habitId as any })
  const logHabit = useMutation(api.habitLogs.logHabit)
  const unlogHabit = useMutation(api.habitLogs.unlogHabit)

  const today = useMemo(() => new Date(), [])
  const todayDateStr = useMemo(() => formatDate(today), [today])
  const todayDayOfWeek = useMemo(() => getDayOfWeek(today), [today])
  
  const habitLog = useQuery(
    api.habitLogs.getLogForHabitAndDate,
    habit ? { habitId: habit._id, date: todayDateStr } : "skip"
  )
  
  const isToday = card.day === todayDayOfWeek
  const isCompleted = habitLog && habitLog.count >= (habit?.targetCount ?? 1)
  const isTracked = habit?.isTracked ?? false

  const handleSelect = useCallback(() => {
    selectCard(card.id)
  }, [card.id, selectCard])

  const handleToggle = useCallback(async () => {
    if (!habit || !isTracked || !isToday) return
    if (isCompleted) {
      await unlogHabit({ habitId: habit._id, date: todayDateStr, count: 1 })
    } else {
      await logHabit({ habitId: habit._id, date: todayDateStr, count: 1 })
    }
  }, [habit, isTracked, isToday, isCompleted, habitLog, logHabit, unlogHabit, todayDateStr])

  const handleDelete = useCallback(
    (e: MouseEvent | KeyboardEvent) => {
      e.stopPropagation()
      deleteScheduleCard(card.id)
    },
    [card.id, deleteScheduleCard]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        if (isTracked && isToday) {
          handleToggle()
        } else {
          handleSelect()
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        handleDelete(e)
      }
    },
    [handleSelect, handleDelete, handleToggle, isTracked, isToday]
  )

  if (!habit) return null

  const endTime = getCardEndTime(card)
  const topOffset =
    (card.startHour - SCHEDULE_CONFIG.START_HOUR) * SCHEDULE_CONFIG.SLOT_HEIGHT_PX +
    (card.startMinute / 60) * SCHEDULE_CONFIG.SLOT_HEIGHT_PX
  const height = (card.durationMinutes / 60) * SCHEDULE_CONFIG.SLOT_HEIGHT_PX

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={isTracked && isToday ? handleToggle : handleSelect}
      onKeyDown={handleKeyDown}
      onMouseDown={state.editMode === "edit" ? undefined : undefined}
      className={cn(
        "absolute left-1 right-1 overflow-hidden transition-shadow duration-150",
        "flex flex-col justify-between select-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 outline-none",
        state.editMode === "edit" ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        isSelected && "ring-2 ring-foreground ring-offset-1 ring-offset-background z-10",
        isCompleted && isToday && "ring-2 ring-green-500"
      )}
      style={{
        top: `${topOffset}px`,
        height: `${height}px`,
        backgroundColor: habit.color,
      }}
      aria-label={`${habit.name} from ${formatTime(card.startHour, card.startMinute)} to ${formatTime(endTime.hour, endTime.minute)}${isCompleted && isToday ? " - Completed" : ""}`}
      aria-selected={isSelected}
      data-card-id={card.id}
    >
      {/* Card content */}
      <div className="p-2 flex flex-col h-full text-white relative">
        {isCompleted && isToday && (
          <div className="absolute top-2 right-2 z-10 bg-white/20 rounded-full p-1" aria-hidden="true">
            <Check className="size-3" />
          </div>
        )}

        <div className="flex items-start justify-between gap-1 min-h-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider truncate font-display">
              {habit.name}
            </p>
            {height >= 50 && (
              <p className="text-[10px] opacity-80 tabular-nums font-display mt-0.5">
                {formatTime(card.startHour, card.startMinute)} - {formatTime(endTime.hour, endTime.minute)}
              </p>
            )}
          </div>
          {state.editMode === "edit" && (
            <button
              onClick={handleDelete}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleDelete(e)
                }
              }}
              className="p-0.5 hover:bg-white/20 transition-colors flex-shrink-0 z-10"
              aria-label={`Delete ${habit.name}`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          )}
        </div>
        {height >= 70 && (
          <p className="text-[10px] opacity-70 font-display mt-auto">
            {formatDuration(card.durationMinutes)}
          </p>
        )}
      </div>

      {/* View mode click indicator for tracked habits */}
      {state.editMode === "view" && isTracked && isToday && (
        <div className="absolute inset-0 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center">
          {isCompleted ? (
            <Check className="size-8 text-white" />
          ) : (
            <div className="w-6 h-6 border-2 border-white/60 rounded-sm" />
          )}
        </div>
      )}

      {/* Edit mode handles */}
      {state.editMode === "edit" && (
        <>
          {/* Vertical resize handle (bottom) */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/20 transition-colors group"
            role="slider"
            aria-label="Resize duration"
            aria-valuemin={SCHEDULE_CONFIG.MIN_DURATION_MINUTES}
            aria-valuemax={SCHEDULE_CONFIG.MAX_DURATION_MINUTES}
            aria-valuenow={card.durationMinutes}
            tabIndex={-1}
          >
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white/40 group-hover:bg-white/80 transition-colors" />
          </div>

          {/* Horizontal resize handles (left/right for recurrence) */}
          <div
            className="absolute top-0 left-0 bottom-2 w-2 cursor-ew-resize hover:bg-white/20 transition-colors flex items-center justify-center"
            role="button"
            aria-label="Extend to previous days"
            tabIndex={-1}
          >
            <GripVertical className="size-3 opacity-0 hover:opacity-60" aria-hidden="true" />
          </div>
          <div
            className="absolute top-0 right-0 bottom-2 w-2 cursor-ew-resize hover:bg-white/20 transition-colors flex items-center justify-center"
            role="button"
            aria-label="Extend to next days"
            tabIndex={-1}
          >
            <GripVertical className="size-3 opacity-0 hover:opacity-60" aria-hidden="true" />
          </div>
        </>
      )}
    </div>
  )
}
