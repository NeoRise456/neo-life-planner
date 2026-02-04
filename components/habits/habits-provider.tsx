"use client"

import { createContext, useContext, useReducer, useCallback, useEffect } from "react"
import { Id } from "@/convex/_generated/dataModel"
import { formatDate, subtractDays } from "./utils"

export type ViewMode = "checklist" | "grid"

interface HabitsUIState {
  selectedHabitId: Id<"habits"> | null
  isAddSheetOpen: boolean
  isEditSheetOpen: boolean
  selectedDate: Date
  viewMode: ViewMode
}

type HabitsUIAction =
  | { type: "SELECT_HABIT"; payload: Id<"habits"> | null }
  | { type: "OPEN_ADD_SHEET" }
  | { type: "CLOSE_ADD_SHEET" }
  | { type: "OPEN_EDIT_SHEET"; payload: Id<"habits"> }
  | { type: "CLOSE_EDIT_SHEET" }
  | { type: "SET_DATE"; payload: Date }
  | { type: "NAVIGATE_DATE"; payload: number }
  | { type: "SET_VIEW_MODE"; payload: ViewMode }

const initialState: HabitsUIState = {
  selectedHabitId: null,
  isAddSheetOpen: false,
  isEditSheetOpen: false,
  selectedDate: new Date(),
  viewMode: "checklist",
}

function habitsReducer(state: HabitsUIState, action: HabitsUIAction): HabitsUIState {
  switch (action.type) {
    case "SELECT_HABIT":
      return { ...state, selectedHabitId: action.payload }
    case "OPEN_ADD_SHEET":
      return { ...state, isAddSheetOpen: true }
    case "CLOSE_ADD_SHEET":
      return { ...state, isAddSheetOpen: false }
    case "OPEN_EDIT_SHEET":
      return { ...state, isEditSheetOpen: true, selectedHabitId: action.payload }
    case "CLOSE_EDIT_SHEET":
      return { ...state, isEditSheetOpen: false }
    case "SET_DATE":
      return { ...state, selectedDate: action.payload }
    case "NAVIGATE_DATE":
      return { ...state, selectedDate: subtractDays(state.selectedDate, action.payload) }
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload }
    default:
      return state
  }
}

interface HabitsContextValue extends HabitsUIState {
  selectHabit: (id: Id<"habits"> | null) => void
  openAddSheet: () => void
  closeAddSheet: () => void
  openEditSheet: (id: Id<"habits">) => void
  closeEditSheet: () => void
  setDate: (date: Date) => void
  navigateDate: (days: number) => void
  setViewMode: (mode: ViewMode) => void
  isToday: boolean
  canGoBack: boolean
  canGoForward: boolean
}

const HabitsContext = createContext<HabitsContextValue | null>(null)

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(habitsReducer, initialState)

  const selectHabit = useCallback((id: Id<"habits"> | null) => {
    dispatch({ type: "SELECT_HABIT", payload: id })
  }, [])

  const openAddSheet = useCallback(() => {
    dispatch({ type: "OPEN_ADD_SHEET" })
  }, [])

  const closeAddSheet = useCallback(() => {
    dispatch({ type: "CLOSE_ADD_SHEET" })
  }, [])

  const openEditSheet = useCallback((id: Id<"habits">) => {
    dispatch({ type: "OPEN_EDIT_SHEET", payload: id })
  }, [])

  const closeEditSheet = useCallback(() => {
    dispatch({ type: "CLOSE_EDIT_SHEET" })
  }, [])

  const setDate = useCallback((date: Date) => {
    dispatch({ type: "SET_DATE", payload: date })
  }, [])

  const navigateDate = useCallback((days: number) => {
    dispatch({ type: "NAVIGATE_DATE", payload: days })
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode })
  }, [])

  const isToday = formatDate(state.selectedDate) === formatDate(new Date())
  const today = new Date()
  const sevenDaysAgo = subtractDays(today, 7)
  const canGoBack = state.selectedDate > sevenDaysAgo
  const canGoForward = state.selectedDate < today

  return (
    <HabitsContext.Provider
      value={{
        ...state,
        selectHabit,
        openAddSheet,
        closeAddSheet,
        openEditSheet,
        closeEditSheet,
        setDate,
        navigateDate,
        setViewMode,
        isToday,
        canGoBack,
        canGoForward,
      }}
    >
      {children}
    </HabitsContext.Provider>
  )
}

export function useHabitsContext() {
  const context = useContext(HabitsContext)
  if (!context) {
    throw new Error("useHabitsContext must be used within HabitsProvider")
  }
  return context
}
