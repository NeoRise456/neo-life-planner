"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function FocusTrendCard() {
  const trend = useQuery(api.habitStats.getFocusTrend, { weeks: 8 })

  const focusData = trend?.map((t) => ({
    primary: t.rate,
    secondary: Math.max(0, t.rate - 15 - Math.random() * 10),
  })) ?? []

  return (
    <div className="col-span-1 md:col-span-4 bg-card p-6 min-h-[300px] flex flex-col tech-border text-muted-foreground">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-display">
            Focus Trend
          </p>
          <h3 className="text-2xl font-bold text-foreground font-display">
            Weekly Rate
          </h3>
        </div>
        <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5 font-display">
          8W
        </span>
      </div>
      <div
        className="flex-1 flex items-end justify-between gap-2"
        role="img"
        aria-label="Weekly habit completion trend"
      >
        {focusData.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground font-display w-full">
            No data yet
          </div>
        ) : (
          focusData.map((data, index) => (
            <div
              key={index}
              className="w-full flex flex-col justify-end gap-[1px] h-48"
              aria-hidden="true"
            >
              <div
                className="w-full bg-muted transition-all duration-300"
                style={{ height: `${data.secondary}%` }}
              />
              <div
                className="w-full bg-foreground transition-all duration-300"
                style={{ height: `${data.primary}%` }}
              />
            </div>
          ))
        )}
      </div>
      <div className="flex justify-between mt-4 text-[10px] text-muted-foreground font-display uppercase border-t border-border pt-2 border-dashed tabular-nums">
        <span>W-8</span>
        <span>W-6</span>
        <span>W-4</span>
        <span>W-2</span>
        <span>Now</span>
      </div>
    </div>
  )
}
