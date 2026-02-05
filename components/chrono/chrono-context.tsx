"use client"

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  type ScheduleCard as GeneratedScheduleCard,
  type DragState,
  type EditMode,
  type DayOfWeek,
  clampDuration,
  cardsOverlap,
} from "./types"

// Context value
interface ChronoContextValue {
  habits: any[]
  scheduleCards: GeneratedScheduleCard[]
  selectedCardId: string | null
  editMode: EditMode
  dragState: DragState | null
  toggleEditMode: () => void
  selectCard: (cardId: string | null) => void
  setDragState: (dragState: DragState | null) => void
  addScheduleCard: (habitId: any, day: DayOfWeek, startHour: number, startMinute: number) => void
  updateScheduleCard: (card: GeneratedScheduleCard) => void
  deleteScheduleCard: (cardId: string) => void
  duplicateCardToDay: (cardId: string, targetDay: DayOfWeek) => void
  getCardsForDay: (day: DayOfWeek) => GeneratedScheduleCard[]
}

const ChronoContext = createContext<ChronoContextValue | null>(null)

// Provider component
export function ChronoProvider({ children }: { children: ReactNode }) {
  const habits = useQuery(api.habits.getHabits) ?? []
  const convexScheduleCards = useQuery(api.scheduleCards.getScheduleCards) ?? []
  const updateScheduleCardMutation = useMutation(api.scheduleCards.updateScheduleCard)
  const createScheduleCardMutation = useMutation(api.scheduleCards.createScheduleCard)
  const deleteScheduleCardMutation = useMutation(api.scheduleCards.deleteScheduleCard)
  const duplicateToDayMutation = useMutation(api.scheduleCards.duplicateToDay)

  const [editMode, setEditModeInternal] = useState<EditMode>("view")
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const validScheduleCards = convexScheduleCards.filter((card) => {
    const habit = habits.find((h) => h._id === card.habitId)
    return habit != null
  })

  const toggleEditMode = useCallback(() => {
    setEditModeInternal((prev) => (prev === "view" ? "edit" : "view"))
  }, [])

  const selectCard = useCallback((cardId: string | null) => {
    setSelectedCardId(cardId)
  }, [])

  const addScheduleCard = useCallback(
    async (habitId: any, day: DayOfWeek, startHour: number, startMinute: number) => {
      const habit = habits.find((h) => h._id === habitId)
      if (!habit) return

      const DEFAULT_DURATION_MINUTES = 60

      // Check for overlaps
      const hasOverlap = validScheduleCards.some((existing) => {
        const newCard: GeneratedScheduleCard = {
          _id: "new-card-temp",
          habitId: habit._id,
          userId: "",
          day,
          startHour,
          startMinute,
          durationMinutes: DEFAULT_DURATION_MINUTES,
        }
        return cardsOverlap(existing as GeneratedScheduleCard, newCard)
      })

      if (hasOverlap) return

      await createScheduleCardMutation({
        habitId: habit._id,
        day,
        startHour,
        startMinute,
        durationMinutes: DEFAULT_DURATION_MINUTES,
      })
    },
    [habits, validScheduleCards, createScheduleCardMutation]
  )

  const updateScheduleCard = useCallback(
    async (card: GeneratedScheduleCard) => {
      const cardWithClampedDuration = {
        ...card,
        durationMinutes: clampDuration(card.durationMinutes),
      }

      // Check for overlaps with other cards (not itself)
      const hasOverlap = validScheduleCards.some(
        (existing) => existing._id !== card._id && cardsOverlap(existing as GeneratedScheduleCard, cardWithClampedDuration)
      )

      if (hasOverlap) return

      await updateScheduleCardMutation({
        id: card._id as any,
        day: card.day,
        startHour: card.startHour,
        startMinute: card.startMinute,
        durationMinutes: cardWithClampedDuration.durationMinutes,
      })
    },
    [validScheduleCards, updateScheduleCardMutation]
  )

  const deleteScheduleCard = useCallback(
    async (cardId: string) => {
      await deleteScheduleCardMutation({ id: cardId as any })
      if (selectedCardId === cardId) {
        setSelectedCardId(null)
      }
    },
    [selectedCardId, deleteScheduleCardMutation]
  )

  const duplicateCardToDay = useCallback(
    async (cardId: string, targetDay: DayOfWeek) => {
      const card = validScheduleCards.find((c) => c._id === cardId)
      if (!card) return

      try {
        await duplicateToDayMutation({ cardId: card.habitId as any, targetDay })
      } catch (error) {
        // Card already exists
      }
    },
    [validScheduleCards, duplicateToDayMutation]
  )

  const getCardsForDay = useCallback(
    (day: DayOfWeek) =>
      (validScheduleCards as GeneratedScheduleCard[])
        .filter((card) => card.day === day)
        .sort((a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute)),
    [validScheduleCards]
  )

  const value: ChronoContextValue = {
    habits,
    scheduleCards: validScheduleCards as GeneratedScheduleCard[],
    selectedCardId,
    editMode,
    dragState,
    toggleEditMode,
    selectCard,
    setDragState,
    addScheduleCard,
    updateScheduleCard,
    deleteScheduleCard,
    duplicateCardToDay,
    getCardsForDay,
  }

  return <ChronoContext.Provider value={value}>{children}</ChronoContext.Provider>
}

// Hook to use context
export function useChrono() {
  const context = useContext(ChronoContext)
  if (!context) {
    throw new Error("useChrono must be used within a ChronoProvider")
  }
  return context
}
