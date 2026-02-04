"use client"

import { useEffect } from "react"
import { useHabitsContext } from "./habits-provider"
import { HabitItem } from "./habit-item"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { formatDate } from "./utils"

export function TodayChecklist() {
  const { selectedDate } = useHabitsContext()
  const dateStr = formatDate(selectedDate)

  const habits = useQuery(api.habits.getHabitsWithStatus, { date: dateStr })

  const streakQueries = habits?.map((habit) =>
    useQuery(api.habitStats.getStreakForHabit, { habitId: habit._id })
  )

  if (!habits) {
    return <div className="p-8 text-center text-muted-foreground font-display">Loading habits...</div>
  }

  const completed = habits.filter((h) => h.todayCount >= h.targetCount)
  const inProgress = habits.filter((h) => h.todayCount > 0 && h.todayCount < h.targetCount)
  const pending = habits.filter((h) => h.todayCount === 0)

  const allCompleted = completed.length === habits.length && habits.length > 0

  if (habits.length === 0) {
    return (
      <div className="p-8 text-center border border-border bg-card tech-border">
        <p className="text-muted-foreground font-display mb-4">No habits yet</p>
        <p className="text-sm text-muted-foreground font-display">
          Create your first habit to start tracking
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-display tracking-tight">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
          </h2>
          <p className="text-xs text-muted-foreground font-display uppercase tracking-widest mt-1">
            {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-display tabular-nums">
            {completed.length}/{habits.length}
          </p>
          <p className="text-xs text-muted-foreground font-display uppercase tracking-widest">
            {allCompleted ? "ALL DONE" : "HABITS DONE"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {pending.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-display">
              PENDING
            </h3>
            {pending.map((habit, index) => (
              <HabitItem
                key={habit._id}
                habit={habit}
                todayCount={habit.todayCount}
                streak={streakQueries?.[habits.indexOf(habit)] ?? { current: 0, hasShield: false }}
              />
            ))}
          </div>
        )}

        {inProgress.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-display">
              IN PROGRESS
            </h3>
            {inProgress.map((habit) => (
              <HabitItem
                key={habit._id}
                habit={habit}
                todayCount={habit.todayCount}
                streak={streakQueries?.[habits.indexOf(habit)] ?? { current: 0, hasShield: false }}
              />
            ))}
          </div>
        )}

        {completed.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-display">
              COMPLETED
            </h3>
            {completed.map((habit) => (
              <HabitItem
                key={habit._id}
                habit={habit}
                todayCount={habit.todayCount}
                streak={streakQueries?.[habits.indexOf(habit)] ?? { current: 0, hasShield: false }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
