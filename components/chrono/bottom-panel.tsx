"use client"

import { useCallback } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"
import { useChrono } from "./chrono-context"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CARD_COLORS, formatTime, formatDuration, getCardEndTime, SCHEDULE_CONFIG, DAY_FULL_LABELS } from "./types"

interface HabitWithScheduleCard {
  _id: any
  name: string
  color: string
  icon: string | undefined
  isTracked: boolean
  frequency: string
}

function PaletteCard({ habit }: { habit: HabitWithScheduleCard }) {
  const { editMode } = useChrono()

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (editMode !== "edit") {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData("habitId", habit._id)
    e.dataTransfer.effectAllowed = "copy"
  }, [habit._id, editMode])

  return (
    <div
      draggable={editMode === "edit"}
      onDragStart={handleDragStart}
      className={cn(
        "flex items-center gap-3 p-3 border border-border bg-card hover:bg-accent/50 transition-colors group",
        editMode === "edit" && "cursor-grab active:cursor-grabbing"
      )}
      role="listitem"
      aria-label={habit.name}
    >
      <div className="w-4 h-4 flex-shrink-0" style={{ backgroundColor: habit.color }} aria-hidden="true" />
      <p className="text-sm font-medium truncate font-display flex-1">{habit.name}</p>
    </div>
  )
}

function CardCollection() {
  const { editMode } = useChrono()

  const habits = useQuery(api.habits.getHabits) ?? []

  return (
    <div className="flex-1 flex flex-col border-r border-border min-w-0">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
            Activity Palette
          </p>
          <h4 className="text-sm font-bold text-foreground font-display">
            Habits
          </h4>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {habits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground font-display mb-2">
                No habits yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/habits"}
                className="font-display h-8 text-xs"
              >
                Create Habits
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2" role="list" aria-label="Available schedule cards">
              {habits.map((habit) => (
                <PaletteCard
                  key={habit._id}
                  habit={habit as HabitWithScheduleCard}
                />
              ))}
            </div>
          )}

          {editMode === "edit" && habits.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-3 text-center font-display">
              Drag cards to timetable or right-click a time slot
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function CardInfo() {
  const { editMode, selectedCardId, scheduleCards, updateScheduleCard, deleteScheduleCard } = useChrono()

  const selectedScheduleCard = selectedCardId
    ? scheduleCards.find((c) => c._id === selectedCardId)
    : null

  const habit = useQuery(
    api.habits.getHabitById,
    selectedScheduleCard ? { id: selectedScheduleCard.habitId as any } : "skip"
  )

  if (selectedScheduleCard && habit) {
    const endTime = getCardEndTime(selectedScheduleCard)

    return (
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-2 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-4 h-4 flex-shrink-0" style={{ backgroundColor: habit.color }} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
                Scheduled Card
              </p>
              <h4 className="text-sm font-bold text-foreground font-display truncate">
                {habit.name}
              </h4>
            </div>
          </div>
          {editMode === "edit" && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => deleteScheduleCard(selectedScheduleCard._id)}
              className="text-destructive hover:bg-destructive/10 flex-shrink-0"
              aria-label={`Delete ${habit.name}`}
            >
              <span className="size-3 flex items-center justify-center">×</span>
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-display uppercase mb-1">Day</p>
              <p className="text-sm font-medium font-display">
                {DAY_FULL_LABELS[selectedScheduleCard.day]}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground font-display uppercase mb-1">Start Time</p>
                {editMode === "edit" ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={SCHEDULE_CONFIG.START_HOUR}
                      max={SCHEDULE_CONFIG.END_HOUR}
                      value={selectedScheduleCard.startHour}
                      onChange={(e) => updateScheduleCard({ ...selectedScheduleCard, startHour: parseInt(e.target.value) || 0 })}
                      className="w-12 text-center tabular-nums font-display h-8 text-sm border border-border bg-background"
                      aria-label="Start hour"
                    />
                    <span className="text-muted-foreground">:</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={30}
                      value={selectedScheduleCard.startMinute}
                      onChange={(e) => updateScheduleCard({ ...selectedScheduleCard, startMinute: parseInt(e.target.value) || 0 })}
                      className="w-12 text-center tabular-nums font-display h-8 text-sm border border-border bg-background"
                      aria-label="Start minute"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-medium tabular-nums font-display">
                    {formatTime(selectedScheduleCard.startHour, selectedScheduleCard.startMinute)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-display uppercase mb-1">End Time</p>
                <p className="text-sm font-medium tabular-nums font-display">
                  {formatTime(endTime.hour, endTime.minute)}
                </p>
              </div>
              </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-display uppercase mb-1">Duration</p>
              {editMode === "edit" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={SCHEDULE_CONFIG.MIN_DURATION_MINUTES}
                    max={SCHEDULE_CONFIG.MAX_DURATION_MINUTES}
                    step={30}
                    value={selectedScheduleCard.durationMinutes}
                    onChange={(e) => updateScheduleCard({ ...selectedScheduleCard, durationMinutes: parseInt(e.target.value) || 30 })}
                    className="w-16 tabular-nums font-display h-8 text-sm border border-border bg-background"
                    aria-label="Duration in minutes"
                  />
                  <span className="text-xs text-muted-foreground font-display">
                    min ({formatDuration(selectedScheduleCard.durationMinutes)})
                  </span>
                </div>
              ) : (
                <p className="text-sm font-medium font-display">
                  {formatDuration(selectedScheduleCard.durationMinutes)}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/habits"}
                className="font-display h-7 text-xs w-full"
              >
                Edit Habit in Dashboard
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-4 py-2 border-b border-border flex-shrink-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
          Card Inspector
        </p>
        <h4 className="text-sm font-bold text-foreground font-display">
          Selected Card
        </h4>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground font-display text-center">
          Select a scheduled card from the timetable to view its details
        </p>
      </div>
    </div>
  )
}

export function BottomPanel() {
  return (
    <div className="flex h-full">
      <CardCollection />
      <CardInfo />
    </div>
  )
}
