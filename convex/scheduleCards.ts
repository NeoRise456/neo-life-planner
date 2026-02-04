import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createScheduleCard = mutation({
  args: {
    habitId: v.id("habits"),
    day: v.number(),
    startHour: v.number(),
    startMinute: v.number(),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== userId.tokenIdentifier) {
      throw new Error("Habit not found");
    }

    return await ctx.db.insert("scheduleCards", {
      habitId: args.habitId,
      userId: userId.tokenIdentifier,
      day: args.day,
      startHour: args.startHour,
      startMinute: args.startMinute,
      durationMinutes: args.durationMinutes,
    });
  },
});

export const updateScheduleCard = mutation({
  args: {
    id: v.id("scheduleCards"),
    day: v.optional(v.number()),
    startHour: v.optional(v.number()),
    startMinute: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== userId.tokenIdentifier) {
      throw new Error("Schedule card not found");
    }

    const updateData: Record<string, unknown> = {};
    if (args.day !== undefined) updateData.day = args.day;
    if (args.startHour !== undefined) updateData.startHour = args.startHour;
    if (args.startMinute !== undefined) updateData.startMinute = args.startMinute;
    if (args.durationMinutes !== undefined) updateData.durationMinutes = args.durationMinutes;

    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

export const deleteScheduleCard = mutation({
  args: { id: v.id("scheduleCards") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const card = await ctx.db.get(args.id);
    if (!card || card.userId !== userId.tokenIdentifier) {
      throw new Error("Schedule card not found");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const getScheduleCards = query({
  handler: async (ctx) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) return [];

    const cards = await ctx.db
      .query("scheduleCards")
      .withIndex("by_user", (q) => q.eq("userId", userId.tokenIdentifier))
      .collect();

    return cards;
  },
});

export const duplicateToDay = mutation({
  args: {
    cardId: v.id("scheduleCards"),
    targetDay: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const card = await ctx.db.get(args.cardId);
    if (!card || card.userId !== userId.tokenIdentifier) {
      throw new Error("Schedule card not found");
    }

    const existing = await ctx.db
      .query("scheduleCards")
      .withIndex("by_user", (q) => q.eq("userId", userId.tokenIdentifier))
      .filter((q) =>
        q.and(
          q.eq(q.field("habitId"), card.habitId),
          q.eq(q.field("day"), args.targetDay),
          q.eq(q.field("startHour"), card.startHour),
          q.eq(q.field("startMinute"), card.startMinute)
        )
      )
      .first();

    if (existing) {
      throw new Error("Schedule card already exists for this day and time");
    }

    return await ctx.db.insert("scheduleCards", {
      habitId: card.habitId,
      userId: userId.tokenIdentifier,
      day: args.targetDay,
      startHour: card.startHour,
      startMinute: card.startMinute,
      durationMinutes: card.durationMinutes,
    });
  },
});

export const bulkUpdate = mutation({
  args: {
    cards: v.array(
      v.object({
        id: v.id("scheduleCards"),
        day: v.optional(v.number()),
        startHour: v.optional(v.number()),
        startMinute: v.optional(v.number()),
        durationMinutes: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    for (const cardData of args.cards) {
      const card = await ctx.db.get(cardData.id);
      if (!card || card.userId !== userId.tokenIdentifier) continue;

      const updateData: Record<string, unknown> = {};
      if (cardData.day !== undefined) updateData.day = cardData.day;
      if (cardData.startHour !== undefined) updateData.startHour = cardData.startHour;
      if (cardData.startMinute !== undefined) updateData.startMinute = cardData.startMinute;
      if (cardData.durationMinutes !== undefined) updateData.durationMinutes = cardData.durationMinutes;

      if (Object.keys(updateData).length > 0) {
        await ctx.db.patch(cardData.id, updateData);
      }
    }

    return { success: true };
  },
});

export const deleteAllForHabit = mutation({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    const userId = await ctx.auth.getUserIdentity();
    if (!userId) throw new Error("Not authenticated");

    const cards = await ctx.db
      .query("scheduleCards")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();

    for (const card of cards) {
      if (card.userId === userId.tokenIdentifier) {
        await ctx.db.delete(card._id);
      }
    }

    return { deleted: cards.length };
  },
});
