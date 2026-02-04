import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const CARD_COLORS = [
  "oklch(0.55 0.02 260)",
  "oklch(0.55 0.18 25)",
  "oklch(0.65 0.18 55)",
  "oklch(0.70 0.18 80)",
  "oklch(0.55 0.15 150)",
  "oklch(0.55 0.12 180)",
  "oklch(0.55 0.15 240)",
  "oklch(0.55 0.18 280)",
  "oklch(0.60 0.18 340)",
];

const DEFAULT_HABITS = [
  { name: "Gym", color: CARD_COLORS[4], icon: "Dumbbell", defaultDurationMinutes: 60 },
  { name: "Work", color: CARD_COLORS[6], icon: "Briefcase", defaultDurationMinutes: 120 },
];

export const createHabit = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    icon: v.optional(v.string()),
    frequency: v.string(),
    targetDaysPerWeek: v.optional(v.number()),
    targetCount: v.number(),
    isTracked: v.boolean(),
    defaultDurationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId.tokenIdentifier))
      .collect();
    const sortOrder = habits.length;

    return await ctx.db.insert("habits", {
      name: args.name,
      description: args.description,
      color: args.color,
      icon: args.icon,
      frequency: args.frequency,
      targetDaysPerWeek: args.targetDaysPerWeek,
      targetCount: args.targetCount,
      isTracked: args.isTracked,
      defaultDurationMinutes: args.defaultDurationMinutes,
      userId: userId.tokenIdentifier,
      createdAt: now,
      isArchived: false,
      sortOrder,
    });
  },
});

export const createDefaultHabits = mutation({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const existingHabits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId.tokenIdentifier))
      .collect();

    if (existingHabits.length > 0) {
      return { created: 0 };
    }

    const now = Date.now();
    const createdIds = [];

    for (let i = 0; i < DEFAULT_HABITS.length; i++) {
      const habit = DEFAULT_HABITS[i];
      const id = await ctx.db.insert("habits", {
        name: habit.name,
        color: habit.color,
        icon: habit.icon,
        frequency: "daily",
        targetCount: 1,
        isTracked: true,
        defaultDurationMinutes: habit.defaultDurationMinutes,
        userId: userId.tokenIdentifier,
        createdAt: now,
        isArchived: false,
        sortOrder: i,
      });
      createdIds.push(id);
    }

    return { created: createdIds.length };
  },
});

export const updateHabit = mutation({
  args: {
    id: v.id("habits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    frequency: v.optional(v.string()),
    targetDaysPerWeek: v.optional(v.number()),
    targetCount: v.optional(v.number()),
    isTracked: v.optional(v.boolean()),
    defaultDurationMinutes: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      throw new Error("Habit not found");
    }

    const updateData: Record<string, unknown> = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.color !== undefined) updateData.color = args.color;
    if (args.icon !== undefined) updateData.icon = args.icon;
    if (args.frequency !== undefined) updateData.frequency = args.frequency;
    if (args.targetDaysPerWeek !== undefined) updateData.targetDaysPerWeek = args.targetDaysPerWeek;
    if (args.targetCount !== undefined) updateData.targetCount = args.targetCount;
    if (args.isTracked !== undefined) updateData.isTracked = args.isTracked;
    if (args.defaultDurationMinutes !== undefined) updateData.defaultDurationMinutes = args.defaultDurationMinutes;
    if (args.sortOrder !== undefined) updateData.sortOrder = args.sortOrder;

    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

export const archiveHabit = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      throw new Error("Habit not found");
    }

    await ctx.db.patch(args.id, { isArchived: true });
    return args.id;
  },
});

export const deleteHabit = mutation({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      throw new Error("Habit not found");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const reorderHabits = mutation({
  args: { habitIds: v.array(v.id("habits")) },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    for (let i = 0; i < args.habitIds.length; i++) {
      const habitId = args.habitIds[i];
      const habit = await ctx.db.get(habitId);
      if (habit && habit.userId === userId.tokenIdentifier) {
        await ctx.db.patch(habitId, { sortOrder: i });
      }
    }

    return { success: true };
  },
});

export const getHabits = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", false))
      .collect();

    return habits.sort((a, b) => {
      const aOrder = a.sortOrder ?? 9999;
      const bOrder = b.sortOrder ?? 9999;
      return aOrder - bOrder;
    });
  },
});

export const getHabitsWithTodayStatus = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", false))
      .collect();

    const habitIds = habits.map((h) => h._id);

    const logs = await Promise.all(
      habitIds.map((habitId) =>
        ctx.db
          .query("habitLogs")
          .withIndex("by_habit_date", (q) => q.eq("habitId", habitId).eq("date", dateStr))
          .first()
      )
    );

    return habits.map((habit, index) => ({
      ...habit,
      todayCount: logs[index]?.count ?? 0,
    }));
  },
});

export const getHabitsWithStatus = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", false))
      .collect();

    const habitIds = habits.map((h) => h._id);

    const logs = await Promise.all(
      habitIds.map((habitId) =>
        ctx.db
          .query("habitLogs")
          .withIndex("by_habit_date", (q) => q.eq("habitId", habitId).eq("date", args.date))
          .first()
      )
    );

    return habits.map((habit, index) => ({
      ...habit,
      todayCount: logs[index]?.count ?? 0,
    }));
  },
});

export const getArchivedHabits = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", true))
      .collect();

    return habits;
  },
});

export const getHabitById = query({
  args: { id: v.id("habits") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return null;

    const habit = await ctx.db.get(args.id);
    if (!habit || habit.userId !== userId.tokenIdentifier) return null;

    return habit;
  },
});

export const getAllHabits = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", userId.tokenIdentifier))
      .collect();

    return habits.sort((a, b) => {
      const aOrder = a.sortOrder ?? 9999;
      const bOrder = b.sortOrder ?? 9999;
      return aOrder - bOrder;
    });
  },
});
