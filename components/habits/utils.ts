export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getDayOfWeek(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export const HABIT_ICONS = [
  "Dumbbell",
  "Bicycle",
  "Heart",
  "Brain",
  "Book",
  "Coffee",
  "Moon",
  "Sun",
  "Clock",
  "Calendar",
  "CheckCircle",
  "Target",
  "Flame",
  "Zap",
  "Shield",
  "Star",
  "Music",
  "Headphones",
  "Utensils",
  "GlassWater",
  "Apple",
  "Carrot",
  "Laptop",
  "Phone",
  "Briefcase",
  "Home",
  "MapPin",
  "Plane",
  "Train",
  "Footprints",
  "Palette",
  "Pen",
  "Camera",
  "Film",
  "Gamepad2",
  "Code",
  "Terminal",
  "Database",
  "Server",
  "Cloud",
  "Wifi",
  "Battery",
] as const;

export type HabitIcon = (typeof HABIT_ICONS)[number];
