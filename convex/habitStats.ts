import { v } from "convex/values";
import { query } from "./_generated/server";

function subtractDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isMonday(dateStr: string): boolean {
  const date = new Date(dateStr);
  return date.getDay() === 1;
}

function getMondayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

export const getStreakForHabit = query({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return { current: 0, best: 0, hasShield: false };

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      return { current: 0, best: 0, hasShield: false };
    }

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();

    const logMap = new Map(logs.map((l) => [l.date, l.count]));

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let currentStreak = 0;
    let bestStreak = 0;
    let currentStreakRun: number = 0;

    let shieldUsedThisWeek = false;
    let currentMonday = getMondayOfWeek(todayStr);

    for (let i = 0; i < 365; i++) {
      const date = subtractDays(todayStr, i);
      const weekMonday = getMondayOfWeek(date);

      if (weekMonday !== currentMonday) {
        currentMonday = weekMonday;
        shieldUsedThisWeek = false;
      }

      const count = logMap.get(date) ?? 0;
      const completed = count >= habit.targetCount;

      if (completed) {
        currentStreak++;
        currentStreakRun++;
        bestStreak = Math.max(bestStreak, currentStreakRun);
      } else if (!shieldUsedThisWeek && habit.frequency === "daily") {
        shieldUsedThisWeek = true;
      } else {
        currentStreakRun = 0;
      }
    }

    const hasShield = isMonday(todayStr) || (currentStreak > 0 && !shieldUsedThisWeek);

    return {
      current: currentStreak,
      best: bestStreak,
      hasShield,
    };
  },
});

export const getOverallStreak = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return { current: 0, best: 0, habitName: "" };

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", false))
      .collect();

    if (habits.length === 0) {
      return { current: 0, best: 0, habitName: "" };
    }

    let maxCurrent = 0;
    let maxBest = 0;
    let habitWithMaxCurrent = "";

    for (const habit of habits) {
      const logs = await ctx.db
        .query("habitLogs")
        .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
        .collect();

      const logMap = new Map(logs.map((l) => [l.date, l.count]));

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      let currentStreak = 0;
      let currentStreakRun: number = 0;

      let shieldUsedThisWeek = false;
      let currentMonday = getMondayOfWeek(todayStr);

      for (let i = 0; i < 365; i++) {
        const date = subtractDays(todayStr, i);
        const weekMonday = getMondayOfWeek(date);

        if (weekMonday !== currentMonday) {
          currentMonday = weekMonday;
          shieldUsedThisWeek = false;
        }

        const count = logMap.get(date) ?? 0;
        const completed = count >= habit.targetCount;

        if (completed) {
          currentStreak++;
          currentStreakRun++;
        } else if (!shieldUsedThisWeek && habit.frequency === "daily") {
          shieldUsedThisWeek = true;
        } else {
          currentStreakRun = 0;
        }
      }

      if (currentStreakRun > maxCurrent) {
        maxCurrent = currentStreakRun;
        habitWithMaxCurrent = habit.name;
      }

      maxBest = Math.max(maxBest, currentStreak);
    }

    return {
      current: maxCurrent,
      best: maxBest,
      habitName: habitWithMaxCurrent,
    };
  },
});

export const getConsistencyRate = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return { rate: 0, completed: 0, total: 0 };

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", false))
      .collect();

    const trackedHabits = habits.filter((h) => h.isTracked && h.frequency === "daily");
    if (trackedHabits.length === 0) {
      return { rate: 0, completed: 0, total: 0 };
    }

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - args.days + 1);

    let completed = 0;
    let total = 0;

    for (let i = 0; i < args.days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      for (const habit of trackedHabits) {
        total++;
        const log = await ctx.db
          .query("habitLogs")
          .withIndex("by_habit_date", (q) => q.eq("habitId", habit._id).eq("date", dateStr))
          .first();

        if (log && log.count >= habit.targetCount) {
          completed++;
        }
      }
    }

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { rate, completed, total };
  },
});

export const getDailyVolume = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return { completed: 0, total: 0, percentage: 0 };

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", false))
      .collect();

    const trackedHabits = habits.filter((h) => h.isTracked && h.frequency === "daily");
    const total = trackedHabits.length;

    if (total === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const logs = await Promise.all(
      trackedHabits.map((habit) =>
        ctx.db
          .query("habitLogs")
          .withIndex("by_habit_date", (q) => q.eq("habitId", habit._id).eq("date", args.date))
          .first()
      )
    );

    const completed = logs.filter((log) => log && log.count >= trackedHabits[logs.indexOf(log)!].targetCount).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  },
});

export const getWeeklyProgress = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", false))
      .collect();

    const trackedHabits = habits.filter((h) => h.isTracked && h.frequency === "daily");

    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    monday.setDate(diff);

    const results = [];

    for (const habit of trackedHabits) {
      let completedDays = 0;
      const targetDays = habit.frequency === "weekly" ? (habit.targetDaysPerWeek ?? 7) : 7;

      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(date.getDate() + i);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        const log = await ctx.db
          .query("habitLogs")
          .withIndex("by_habit_date", (q) => q.eq("habitId", habit._id).eq("date", dateStr))
          .first();

        if (log && log.count >= habit.targetCount) {
          completedDays++;
        }
      }

      const percentage = Math.round((completedDays / targetDays) * 100);

      results.push({
        habitId: habit._id,
        name: habit.name,
        color: habit.color,
        percentage,
        completedDays,
        targetDays,
      });
    }

    return results.sort((a, b) => b.percentage - a.percentage);
  },
});

export const getFocusTrend = query({
  args: { weeks: v.number() },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", false))
      .collect();

    const trackedHabits = habits.filter((h) => h.isTracked && h.frequency === "daily");

    const results = [];
    const today = new Date();

    for (let w = args.weeks - 1; w >= 0; w--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - w * 7);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      let completed = 0;
      let total = 0;

      for (let d = 0; d < 7; d++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + d);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        for (const habit of trackedHabits) {
          total++;
          const log = await ctx.db
            .query("habitLogs")
            .withIndex("by_habit_date", (q) => q.eq("habitId", habit._id).eq("date", dateStr))
            .first();

          if (log && log.count >= habit.targetCount) {
            completed++;
          }
        }
      }

      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const weekLabel = `W${Math.floor(weekStart.getTime() / (7 * 24 * 60 * 60 * 1000))}`;

      results.push({ week: weekLabel, rate });
    }

    return results;
  },
});

export const getDensityMapData = query({
  args: { weeks: v.number() },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user_active", (q) => q.eq("userId", userId.tokenIdentifier).eq("isArchived", false))
      .collect();

    const trackedHabits = habits.filter((h) => h.isTracked && h.frequency === "daily");

    const today = new Date();
    const results = [];

    for (let i = args.weeks * 7 - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      let completed = 0;
      const total = trackedHabits.length;

      for (const habit of trackedHabits) {
        const log = await ctx.db
          .query("habitLogs")
          .withIndex("by_habit_date", (q) => q.eq("habitId", habit._id).eq("date", dateStr))
          .first();

        if (log && log.count >= habit.targetCount) {
          completed++;
        }
      }

      const intensity = total > 0 ? completed / total : 0;
      results.push({ date: dateStr, intensity });
    }

    return results;
  },
});
