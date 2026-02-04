"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function CurrentStreakCard() {
  const streak = useQuery(api.habitStats.getOverallStreak)

  const currentStreak = streak?.current ?? 0
  const goalDays = 30
  const progressPercent = Math.min(100, Math.round((currentStreak / goalDays) * 100))

  const streakProgress = Array.from({ length: 10 }, (_, i) => ({
    filled: i < Math.min(10, Math.ceil(currentStreak / 3)),
  }))

  return (
    <div className="col-span-1 md:col-span-4 bg-card p-6 h-80 flex flex-col tech-border text-muted-foreground">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-display">
            Current Streak
          </p>
          <h3 className="text-3xl font-bold text-foreground font-display">
            {currentStreak} Days
          </h3>
          {streak?.habitName && (
            <p className="text-xs text-muted-foreground font-display mt-1">
              {streak.habitName}
            </p>
          )}
        </div>
        <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5 font-display">
          RUNNING
        </span>
      </div>
      <div className="flex justify-between text-xs mb-2 font-display">
        <span className="text-foreground">Goal: {goalDays} Days</span>
        <span className="text-muted-foreground tabular-nums">{progressPercent}%</span>
      </div>
      <div
        className="h-8 w-full flex gap-[2px] mb-8"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Streak progress: ${progressPercent}%`}
      >
        {streakProgress.map((segment, index) => (
          <div
            key={index}
            className={`flex-1 ${segment.filled ? "bg-foreground" : "bg-muted"}`}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className="flex-1 flex items-end justify-center">
        {streak?.best && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground font-display uppercase">
              Best Streak
            </p>
            <p className="text-xl font-bold text-foreground font-display">
              {streak.best} Days
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
