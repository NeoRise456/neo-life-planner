"use client"

import { useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { ChronoSidebar } from "@/components/chrono/chrono-sidebar"
import { HabitsProvider, useHabitsContext } from "./habits-provider"
import { HabitsHeader } from "./habits-header"
import { TodayChecklist } from "./today-checklist"
import { AddHabitSheet } from "./add-habit-sheet"
import { EditHabitSheet } from "./edit-habit-sheet"
import {
  ConsistencyRateCard,
  CurrentStreakCard,
  DailyVolumeCard,
  WeeklyHabitProgressCard,
  FocusTrendCard,
  HabitDensityMap,
} from "./stats"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

function HabitsDashboardContent() {
  const { isToday } = useHabitsContext()
  const createDefaultHabits = useMutation(api.habits.createDefaultHabits)

  useEffect(() => {
    if (isToday) {
      createDefaultHabits({}).catch(console.error)
    }
  }, [isToday, createDefaultHabits])

  return (
    <>
      <HabitsHeader />
      <main className="flex-1 p-0.5 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[1px] bg-border border border-border">
          <ConsistencyRateCard />
          <CurrentStreakCard />
          <DailyVolumeCard />
          <WeeklyHabitProgressCard />
          <FocusTrendCard />
        </div>
        <TodayChecklist />
        <div className="mt-[1px]">
          <HabitDensityMap />
        </div>
      </main>
      <AddHabitSheet />
      <EditHabitSheet />
    </>
  )
}

export function HabitTrackerDashboard() {
  return (
    <SidebarProvider defaultOpen={true}>
      <ChronoSidebar />
      <SidebarInset className="min-h-screen bg-background">
        <HabitsProvider>
          <HabitsDashboardContent />
        </HabitsProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
