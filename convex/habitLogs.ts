import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const logHabit = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.optional(v.string()),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      throw new Error("Habit not found");
    }

    const today = new Date();
    const date = args.date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const existingLog = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) => q.eq("habitId", args.habitId).eq("date", date))
      .first();

    const now = Date.now();
    const count = args.count ?? 1;

    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        count: existingLog.count + count,
        completedAt: now,
      });
      return existingLog._id;
    } else {
      return await ctx.db.insert("habitLogs", {
        habitId: args.habitId,
        userId: userId.tokenIdentifier,
        date,
        count,
        completedAt: now,
      });
    }
  },
});

export const unlogHabit = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.optional(v.string()),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      throw new Error("Habit not found");
    }

    const today = new Date();
    const date = args.date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const existingLog = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) => q.eq("habitId", args.habitId).eq("date", date))
      .first();

    if (!existingLog) {
      throw new Error("Log not found");
    }

    const count = args.count ?? 1;
    const newCount = existingLog.count - count;

    if (newCount <= 0) {
      await ctx.db.delete(existingLog._id);
      return null;
    } else {
      await ctx.db.patch(existingLog._id, {
        count: newCount,
        completedAt: Date.now(),
      });
      return existingLog._id;
    }
  },
});

export const setHabitLog = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      throw new Error("Habit not found");
    }

    const existingLog = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) => q.eq("habitId", args.habitId).eq("date", args.date))
      .first();

    const now = Date.now();

    if (existingLog) {
      if (args.count <= 0) {
        await ctx.db.delete(existingLog._id);
        return null;
      } else {
        await ctx.db.patch(existingLog._id, {
          count: args.count,
          completedAt: now,
        });
        return existingLog._id;
      }
    } else {
      if (args.count <= 0) {
        return null;
      }
      return await ctx.db.insert("habitLogs", {
        habitId: args.habitId,
        userId: userId.tokenIdentifier,
        date: args.date,
        count: args.count,
        completedAt: now,
      });
    }
  },
});

export const deleteLog = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      throw new Error("Habit not found");
    }

    const existingLog = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) => q.eq("habitId", args.habitId).eq("date", args.date))
      .first();

    if (existingLog) {
      await ctx.db.delete(existingLog._id);
    }

    return { success: true };
  },
});

export const getLogsForHabit = query({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      return [];
    }

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();

    return logs.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getLogsForDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId.tokenIdentifier))
      .collect();

    return logs
      .filter((log) => log.date >= args.startDate && log.date <= args.endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getTodayLogs = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId.tokenIdentifier).eq("date", dateStr))
      .collect();

    return logs;
  },
});

export const getLogForHabitAndDate = query({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return null;

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      return null;
    }

    const log = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_date", (q) => q.eq("habitId", args.habitId).eq("date", args.date))
      .first();

    return log;
  },
});
