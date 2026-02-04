"use client"

import { useMemo } from "react"
import { Area, AreaChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { formatDate } from "../utils"

const chartConfig = {
  current: {
    label: "Current",
    color: "var(--chart-1)",
  },
  previous: {
    label: "Previous",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function ConsistencyRateCard() {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 29)

  const consistency = useQuery(api.habitStats.getConsistencyRate, { days: 30 })

  const chartData = useMemo(() => {
    const data = []
    for (let i = 0; i < 11; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + Math.floor(i * 3))
      if (date > today) break
      const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
      data.push({
        time,
        current: 65 + Math.random() * 25,
        previous: 55 + Math.random() * 25,
      })
    }
    return data
  }, [])

  return (
    <div className="col-span-1 md:col-span-4 bg-card p-6 h-80 flex flex-col justify-between tech-border text-muted-foreground">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 font-display">
            Consistency Rate
          </p>
          <h3 className="text-3xl font-bold text-foreground font-display">
            {consistency?.rate ?? 0}%
          </h3>
        </div>
        <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5 font-display">
          30D
        </span>
      </div>
      <div className="flex-1 mt-6 relative">
        <ChartContainer config={chartConfig} className="h-32 w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="fillCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={[60, 100]} hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="font-display"
                  indicator="dot"
                />
              }
            />
            <Area
              type="linear"
              dataKey="current"
              stroke="var(--chart-1)"
              strokeWidth={1}
              fill="url(#fillCurrent)"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground font-display">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-foreground" aria-hidden="true" />
          Current
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-muted-foreground" aria-hidden="true" />
          Previous
        </div>
      </div>
    </div>
  )
}
