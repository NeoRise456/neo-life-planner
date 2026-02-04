"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function WeeklyHabitProgressCard() {
  const habitsProgress = useQuery(api.habitStats.getWeeklyProgress)

  const habits = habitsProgress?.map((h) => ({
    name: h.name,
    progress: h.percentage,
    isLow: h.percentage < 50,
  })) ?? []

  return (
    <div className="col-span-1 md:col-span-8 bg-card p-6 min-h-[300px] flex flex-col tech-border text-muted-foreground">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-display">
            Weekly Habit Progress
          </p>
          <h3 className="text-2xl font-bold text-foreground font-display">
            Completion Metrics
          </h3>
        </div>
        <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5 font-display">
          7D
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-6">
        {habits.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground font-display">
            No habits tracked yet
          </div>
        ) : (
          habits.map((habit) => (
            <div key={habit.name} className="group">
              <div className="flex justify-between mb-2 text-sm font-display">
                <span className="font-medium text-foreground">{habit.name}</span>
                <span className="text-muted-foreground tabular-nums">{habit.progress}%</span>
              </div>
              <div
                className="h-4 w-full bg-muted relative overflow-hidden"
                role="progressbar"
                aria-valuenow={habit.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${habit.name} progress`}
              >
                <div
                  className={`h-full relative transition-all duration-500 ${
                    habit.isLow ? "bg-muted-foreground" : "bg-foreground"
                  }`}
                  style={{ width: `${habit.progress}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-background opacity-20" aria-hidden="true" />
                </div>
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, transparent 98%, rgba(255,255,255,0.05) 98%)",
                    backgroundSize: "2% 100%",
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
