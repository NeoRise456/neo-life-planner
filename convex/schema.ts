import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    recurrence: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    isTerminated: v.optional(v.boolean()),
    userId: v.string(),
    createdAt: v.number(),
    tags: v.optional(v.array(v.string())),
    priority: v.optional(v.string()),
  })
    .index("by_status", ["status"])
    .index("by_status_recurrence", ["status", "recurrence"])
    .index("by_user", ["userId"])
    .index("by_due_date", ["dueDate"]),

  habits: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.optional(v.string()),
    frequency: v.string(),
    targetDaysPerWeek: v.optional(v.number()),
    targetCount: v.number(),
    isTracked: v.boolean(),
    defaultDurationMinutes: v.optional(v.number()),
    userId: v.string(),
    createdAt: v.number(),
    isArchived: v.boolean(),
    sortOrder: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isArchived"]),

  habitLogs: defineTable({
    habitId: v.id("habits"),
    userId: v.string(),
    date: v.string(),
    count: v.number(),
    completedAt: v.number(),
  })
    .index("by_habit", ["habitId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_habit_date", ["habitId", "date"]),

  scheduleCards: defineTable({
    habitId: v.id("habits"),
    userId: v.string(),
    day: v.number(),
    startHour: v.number(),
    startMinute: v.number(),
    durationMinutes: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_habit", ["habitId"]),
});
