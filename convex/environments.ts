import { v } from "convex/values";
import { authComponent } from "./auth";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      return [];
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", project.orgId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      return [];
    }

    const environments = await ctx.db
      .query("environments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return environments.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", project.orgId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this organization");
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("You are not authorized to perform this action");
    }

    const existing = await ctx.db
      .query("environments")
      .withIndex("by_project_and_name", (q) =>
        q.eq("projectId", args.projectId).eq("name", args.name),
      )
      .first();

    if (existing) {
      throw new Error("An environment with this name already exists");
    }

    const environments = await ctx.db
      .query("environments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const maxOrder = Math.max(...environments.map((env) => env.order), -1);

    const envId = await ctx.db.insert("environments", {
      name: args.name,
      projectId: args.projectId,
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(envId);
  },
});

export const update = mutation({
  args: {
    id: v.id("environments"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const environment = await ctx.db.get(args.id);
    if (!environment) {
      throw new Error("Environment not found");
    }

    const project = await ctx.db.get(environment.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", project.orgId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this organization");
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("You are not authorized to perform this action");
    }

    if (args.name && args.name !== environment.name) {
      const newName = args.name;
      const environments = await ctx.db
        .query("environments")
        .withIndex("by_project", (q) =>
          q.eq("projectId", environment.projectId),
        )
        .collect();

      const existing = environments.find(
        (env) =>
          env._id !== args.id &&
          env.name.toLowerCase() === newName.toLowerCase(),
      );

      if (existing) {
        throw new Error("An environment with this name already exists");
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.name && { name: args.name }),
      ...(args.order !== undefined && { order: args.order }),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: {
    id: v.id("environments"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const environment = await ctx.db.get(args.id);
    if (!environment) {
      throw new Error("Environment not found");
    }

    const project = await ctx.db.get(environment.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", project.orgId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this organization");
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("You are not authorized to perform this action");
    }

    const secrets = await ctx.db
      .query("secrets")
      .withIndex("by_environment", (q) => q.eq("environmentId", args.id))
      .collect();

    for (const secret of secrets) {
      await ctx.db.delete(secret._id);
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
