"use client"

import * as Icons from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHabitsContext } from "./habits-provider"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { formatDate } from "./utils"

interface HabitItemProps {
  habit: {
    _id: any
    name: string
    description: string | undefined
    color: string
    icon: string | undefined
    targetCount: number
    isTracked: boolean
  }
  todayCount: number
  streak: { current: number; hasShield: boolean }
}

export function HabitItem({ habit, todayCount, streak }: HabitItemProps) {
  const { selectedDate, openEditSheet } = useHabitsContext()
  const logHabit = useMutation(api.habitLogs.logHabit)
  const unlogHabit = useMutation(api.habitLogs.unlogHabit)
  const dateStr = formatDate(selectedDate)

  const Icon = habit.icon ? (Icons[habit.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>) : null

  const isCompleted = todayCount >= habit.targetCount
  const isInProgress = todayCount > 0 && todayCount < habit.targetCount

  const handleToggle = async () => {
    if (todayCount >= habit.targetCount) {
      await unlogHabit({ habitId: habit._id, date: dateStr, count: 1 })
    } else {
      await logHabit({ habitId: habit._id, date: dateStr, count: 1 })
    }
  }

  const handleIncrement = async () => {
    await logHabit({ habitId: habit._id, date: dateStr, count: 1 })
  }

  const handleDecrement = async () => {
    await unlogHabit({ habitId: habit._id, date: dateStr, count: 1 })
  }

  return (
    <div className="group relative bg-card border border-border p-4 tech-border hover:border-foreground/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex items-center gap-3 flex-1">
          {habit.isTracked && (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggle}
              className="mt-0.5"
              aria-label={`Toggle ${habit.name}`}
            />
          )}
          <div
            className="w-1 h-12 shrink-0"
            style={{ backgroundColor: habit.color }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="size-4 shrink-0" style={{ color: habit.color }} />}
              <h3 className="font-medium font-display truncate text-foreground">
                {habit.name}
              </h3>
            </div>
            {habit.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 font-display">
                {habit.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {streak.current > 0 && habit.isTracked && (
            <div className="flex items-center gap-1.5 text-xs font-display">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Icons.Flame className="size-3.5" aria-hidden="true" />
                {streak.current}d
              </span>
              {streak.hasShield && (
                <span className="text-muted-foreground" title="Shield available this week">
                  <Icons.Shield className="size-3.5" aria-hidden="true" />
                </span>
              )}
            </div>
          )}

          {habit.isTracked && habit.targetCount > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDecrement}
                disabled={todayCount <= 0}
                className="h-7 w-7"
                aria-label="Decrement count"
              >
                <Icons.Minus className="size-3" />
              </Button>
              <span className="text-sm font-mono tabular-nums w-8 text-center font-display">
                {todayCount}/{habit.targetCount}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleIncrement}
                disabled={todayCount >= habit.targetCount}
                className="h-7 w-7"
                aria-label="Increment count"
              >
                <Icons.Plus className="size-3" />
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <Icons.MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditSheet(habit._id)}>
                <Icons.Edit className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isInProgress && (
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{ backgroundColor: habit.color }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
