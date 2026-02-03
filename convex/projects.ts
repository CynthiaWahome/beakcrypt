import { v } from "convex/values";
import { authComponent } from "./auth";
import { query, mutation } from "./_generated/server";

const DEFAULT_ENVIRONMENTS = [
  { name: "local", order: 0 },
  { name: "development", order: 1 },
  { name: "staging", order: 2 },
  { name: "production", order: 3 },
];

export const create = mutation({
  args: {
    name: v.string(),
    orgId: v.id("organizations"),
    githubRepoId: v.optional(v.number()),
    githubRepoUrl: v.optional(v.string()),
    githubRepoName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this organization");
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("You are not authorized to perform this action");
    }

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", args.orgId).eq("name", args.name),
      )
      .first();

    if (existing) {
      throw new Error("A project with this name already exists");
    }

    if (args.githubRepoId) {
      const existingRepo = await ctx.db
        .query("projects")
        .withIndex("by_github_repo", (q) =>
          q.eq("githubRepoId", args.githubRepoId),
        )
        .first();

      if (existingRepo) {
        throw new Error("This repository is already imported");
      }
    }

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      orgId: args.orgId,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      githubRepoId: args.githubRepoId,
      githubRepoUrl: args.githubRepoUrl,
      githubRepoName: args.githubRepoName,
    });

    for (const env of DEFAULT_ENVIRONMENTS) {
      await ctx.db.insert("environments", {
        name: env.name,
        projectId,
        order: env.order,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.get(projectId);
  },
});

export const getByName = query({
  args: {
    name: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this organization");
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", args.orgId).eq("name", args.name),
      )
      .first();
    return project;
  },
});

export const getBySlugAndName = query({
  args: {
    orgSlug: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .first();

    if (!org) {
      return null;
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", org._id).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this organization");
    }

    const project = await ctx.db
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", org._id).eq("name", args.name),
      )
      .first();

    return project;
  },
});

export const checkName = query({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this organization");
    }

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", args.orgId).eq("name", args.name),
      )
      .first();
    return !!existing;
  },
});

export const list = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      return [];
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", user._id),
      )
      .first();

    if (!membership) {
      return [];
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return projects;
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const project = await ctx.db.get(args.id);
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
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", project.orgId).eq("name", args.name),
      )
      .first();

    if (existing && existing._id !== args.id) {
      throw new Error("A project with this name already exists");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: {
    id: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const project = await ctx.db.get(args.id);
    if (!project) {
      throw new Error("Project not found");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", project.orgId).eq("userId", user._id),
      )
      .first();

    if (
      !membership ||
      (membership.role !== "owner" && membership.role !== "admin")
    ) {
      throw new Error("Only owners and admins can delete projects");
    }

    const environments = await ctx.db
      .query("environments")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    for (const env of environments) {
      const secrets = await ctx.db
        .query("secrets")
        .withIndex("by_environment", (q) => q.eq("environmentId", env._id))
        .collect();

      for (const secret of secrets) {
        await ctx.db.delete(secret._id);
      }

      await ctx.db.delete(env._id);
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});
