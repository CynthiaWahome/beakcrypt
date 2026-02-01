import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const add = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    ownerId: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      avatar: args.avatar,
      ownerId: args.ownerId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("organizationMembers", {
      orgId: id,
      userId: args.ownerId,
      role: "owner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return existing;
  },
});

export const list = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const orgs = await Promise.all(
      memberships.map(async (member) => {
        return await ctx.db.get(member.orgId);
      }),
    );

    return orgs.filter((org) => org !== null);
  },
});
