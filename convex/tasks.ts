import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    recurrence: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthorized");

    const taskId = await ctx.db.insert("tasks", {
      ...args,
      status: "active",
      createdAt: Date.now(),
      userId: userId.tokenIdentifier,
    });

    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    recurrence: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthorized");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId.tokenIdentifier) {
      throw new Error("Task not found or unauthorized");
    }

    const { taskId, ...updates } = args;
    await ctx.db.patch(taskId, updates);
  },
});

export const completeTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthorized");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId.tokenIdentifier) {
      throw new Error("Task not found or unauthorized");
    }

    if (task.recurrence) {
      // Create a completed instance for recurring task
      await ctx.db.insert("tasks", {
        title: task.title,
        description: task.description,
        status: "completed",
        completedAt: Date.now(),
        masterTaskId: args.taskId,
        userId: userId.tokenIdentifier,
        createdAt: task.createdAt,
        tags: task.tags,
        priority: task.priority,
      });

      // Update due date for next occurrence
      const nextDueDate = calculateNextDueDate(task.recurrence, task.dueDate || Date.now());
      await ctx.db.patch(args.taskId, { dueDate: nextDueDate });
    } else {
      // Mark one-off task as completed
      await ctx.db.patch(args.taskId, {
        status: "completed",
        completedAt: Date.now(),
      });
    }
  },
});

export const terminateTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthorized");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId.tokenIdentifier) {
      throw new Error("Task not found or unauthorized");
    }

    await ctx.db.patch(args.taskId, {
      isTerminated: true,
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthorized");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId.tokenIdentifier) {
      throw new Error("Task not found or unauthorized");
    }

    await ctx.db.delete(args.taskId);
  },
});

export const getActiveTasks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("userId"), userId.tokenIdentifier))
      .collect();

    return tasks.filter((task) => !task.isTerminated);
  },
});

export const getRoutineTasks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId.tokenIdentifier),
          q.eq(q.field("status"), "active"),
          q.neq(q.field("recurrence"), null),
          q.lte(q.field("dueDate"), todayTimestamp)
        )
      )
      .collect();

    return tasks.filter((task) => !task.isTerminated);
  },
});

export const getInboxTasks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId.tokenIdentifier),
          q.eq(q.field("status"), "active"),
          q.eq(q.field("recurrence"), null)
        )
      )
      .collect();

    return tasks;
  },
});

export const getPastTasks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const tasks = await ctx.db
      .query("tasks")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId.tokenIdentifier),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    return tasks;
  },
});

export const getTaskById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return null;

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId.tokenIdentifier) {
      return null;
    }

    return task;
  },
});

export const getRetentionPeriod = query({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return 30;

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId.tokenIdentifier))
      .first();

    return settings?.retentionPeriod ?? 30;
  },
});

export const updateRetentionPeriod = mutation({
  args: { retentionPeriod: v.number() },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthorized");

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId.tokenIdentifier))
      .first();

    if (settings) {
      await ctx.db.patch(settings._id, { retentionPeriod: args.retentionPeriod });
    } else {
      await ctx.db.insert("settings", {
        userId: userId.tokenIdentifier,
        retentionPeriod: args.retentionPeriod,
      });
    }
  },
});

export const cleanupOldTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Unauthorized");

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId.tokenIdentifier))
      .first();

    const retentionDays = settings?.retentionPeriod ?? 30;
    const cutoffDate = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const oldTasks = await ctx.db
      .query("tasks")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId.tokenIdentifier),
          q.eq(q.field("status"), "completed"),
          q.lt(q.field("completedAt"), cutoffDate)
        )
      )
      .collect();

    for (const task of oldTasks) {
      await ctx.db.delete(task._id);
    }

    return oldTasks.length;
  },
});

function calculateNextDueDate(recurrence: string, currentDueDate: number): number {
  const date = new Date(currentDueDate);

  switch (recurrence) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return currentDueDate;
  }

  return date.getTime();
}
