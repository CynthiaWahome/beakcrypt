import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("waitlists")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return existing;
  },
});

export const add = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("waitlists", {
      email: args.email,
    });
    return id;
  },
});
