import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { Result, success, failure, HttpStatus } from "./types";

export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"waitlists">>> => {
    const existing = await ctx.db
      .query("waitlists")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!existing) {
      return failure(
        HttpStatus.NOT_FOUND,
        "waitlist:not_found",
        "Email not found on waitlist",
      );
    }
    return success(existing);
  },
});

export const add = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"waitlists">>> => {
    const existing = await ctx.db
      .query("waitlists")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return failure(
        HttpStatus.CONFLICT,
        "waitlist:already_exists",
        "You're already in the vault!",
      );
    }

    const id = await ctx.db.insert("waitlists", {
      email: args.email,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const waitlist = await ctx.db.get(id);
    if (!waitlist) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "waitlist:create_failed",
        "Oops! Vault is currently unavailable.",
      );
    }

    return success(waitlist, HttpStatus.CREATED);
  },
});
