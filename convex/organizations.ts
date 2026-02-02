import { v } from "convex/values";
import { authComponent } from "./auth";
import { query, mutation } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Organization URL is already taken");
    }

    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }
    const id = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      avatar: args.avatar,
      ownerId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("organizationMembers", {
      orgId: id,
      userId: user._id,
      role: "owner",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const organization = await ctx.db.get(id);
    if (!organization) {
      throw new Error("Organization not found");
    }
    return organization;
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

export const checkSlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return !!existing;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      return [];
    }

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const orgs = await Promise.all(
      memberships.map(async (member) => {
        return await ctx.db.get(member.orgId);
      }),
    );

    return orgs.filter((org) => org !== null);
  },
});
