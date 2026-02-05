// Chrono System Types

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Monday, 6 = Sunday

export const DAYS_OF_WEEK: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: "MON",
  1: "TUE",
  2: "WED",
  3: "THU",
  4: "FRI",
  5: "SAT",
  6: "SUN",
}

export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
}

// Schedule constraints
export const SCHEDULE_CONFIG = {
  START_HOUR: 6, // 6:00 AM
  END_HOUR: 24, // 12:00 AM (midnight)
  MIN_DURATION_MINUTES: 30,
  MAX_DURATION_MINUTES: 720, // 12 hours
  SLOT_HEIGHT_PX: 60, // Height per hour in pixels
} as const

// Schedule Card Instance (placed on the timetable)
export interface ScheduleCard {
  _id: string
  habitId: string
  userId: string
  day: DayOfWeek
  startHour: number
  startMinute: number
  durationMinutes: number
}

// Drag state for drag-and-drop operations
export interface DragState {
  type: "palette" | "move" | "resize-vertical" | "resize-horizontal-left" | "resize-horizontal-right"
  habitId?: string
  cardId?: string
  startDay?: DayOfWeek
  startHour?: number
  startMinute?: number
  originalCard?: ScheduleCard
}

// Edit mode state
export type EditMode = "view" | "edit"

// Color palette for schedule cards
export const CARD_COLORS = [
  { name: "Slate", value: "oklch(0.55 0.02 260)" },
  { name: "Red", value: "oklch(0.55 0.18 25)" },
  { name: "Orange", value: "oklch(0.65 0.18 55)" },
  { name: "Amber", value: "oklch(0.70 0.18 80)" },
  { name: "Green", value: "oklch(0.55 0.15 150)" },
  { name: "Teal", value: "oklch(0.55 0.12 180)" },
  { name: "Blue", value: "oklch(0.55 0.15 240)" },
  { name: "Violet", value: "oklch(0.55 0.18 280)" },
  { name: "Pink", value: "oklch(0.60 0.18 340)" },
] as const

// Utility functions
export function minutesToHoursMinutes(minutes: number): { hours: number; mins: number } {
  return {
    hours: Math.floor(minutes / 60),
    mins: minutes % 60,
  }
}

export function formatTime(hour: number, minute: number): string {
  // Handle midnight (24:00)
  if (hour === 24) {
    return "12:00 AM"
  }
  const period = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  const displayMinute = minute.toString().padStart(2, "0")
  return `${displayHour}:${displayMinute} ${period}`
}

export function formatDuration(minutes: number): string {
  const { hours, mins } = minutesToHoursMinutes(minutes)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function getTimeSlots(): number[] {
  const slots: number[] = []
  // Generate slots from START_HOUR to END_HOUR - 1 (the last slot ends at END_HOUR)
  for (let hour = SCHEDULE_CONFIG.START_HOUR; hour < SCHEDULE_CONFIG.END_HOUR; hour++) {
    slots.push(hour)
  }
  return slots
}

export function clampDuration(minutes: number): number {
  return Math.min(
    SCHEDULE_CONFIG.MAX_DURATION_MINUTES,
    Math.max(SCHEDULE_CONFIG.MIN_DURATION_MINUTES, minutes)
  )
}

export function snapToSlot(hour: number, minute: number): { hour: number; minute: number } {
  // Snap to nearest 30-minute slot
  const snappedMinute = minute >= 30 ? 30 : 0
  return { hour, minute: snappedMinute }
}

export function getCardEndTime(card: ScheduleCard): { hour: number; minute: number } {
  const totalMinutes = card.startHour * 60 + card.startMinute + card.durationMinutes
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  }
}

export function cardsOverlap(card1: ScheduleCard, card2: ScheduleCard): boolean {
  if (card1.day !== card2.day) return false
  if (card1._id === card2._id) return false

  const start1 = card1.startHour * 60 + card1.startMinute
  const end1 = start1 + card1.durationMinutes
  const start2 = card2.startHour * 60 + card2.startMinute
  const end2 = start2 + card2.durationMinutes

  return start1 < end2 && start2 < end1
}
