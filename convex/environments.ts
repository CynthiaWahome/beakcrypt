import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { Result, success, failure, HttpStatus, isFailure } from "./types";
import { getAuthUser, requireOrgAdmin, requireOrgMember } from "./authHelpers";

export const list = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"environments">[]>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    const authResult = await requireOrgMember(ctx, project.orgId);
    if (isFailure(authResult)) return authResult;

    const environments = await ctx.db
      .query("environments")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return success(environments.sort((a, b) => a.order - b.order));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"environments">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    const authResult = await requireOrgAdmin(ctx, project.orgId);
    if (isFailure(authResult)) return authResult;

    const existing = await ctx.db
      .query("environments")
      .withIndex("by_project_and_name", (q) =>
        q.eq("projectId", args.projectId).eq("name", args.name),
      )
      .first();

    if (existing) {
      return failure(
        HttpStatus.CONFLICT,
        "env:name_taken",
        "An environment with this name already exists",
      );
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

    const environment = await ctx.db.get(envId);
    if (!environment) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "env:create_failed",
        "Failed to create environment",
      );
    }

    return success(environment, HttpStatus.CREATED);
  },
});

export const update = mutation({
  args: {
    id: v.id("environments"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Result<Doc<"environments">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const environment = await ctx.db.get(args.id);
    if (!environment) {
      return failure(
        HttpStatus.NOT_FOUND,
        "env:not_found",
        "Environment not found",
      );
    }

    const project = await ctx.db.get(environment.projectId);
    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    const authResult = await requireOrgAdmin(ctx, project.orgId);
    if (isFailure(authResult)) return authResult;

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
        return failure(
          HttpStatus.CONFLICT,
          "env:name_taken",
          "An environment with this name already exists",
        );
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.name && { name: args.name }),
      ...(args.order !== undefined && { order: args.order }),
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.id);
    if (!updated) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "env:update_failed",
        "Failed to update environment",
      );
    }

    return success(updated);
  },
});

export const remove = mutation({
  args: {
    id: v.id("environments"),
  },
  handler: async (ctx, args): Promise<Result<{ deleted: true }>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const environment = await ctx.db.get(args.id);
    if (!environment) {
      return failure(
        HttpStatus.NOT_FOUND,
        "env:not_found",
        "Environment not found",
      );
    }

    const project = await ctx.db.get(environment.projectId);
    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    const authResult = await requireOrgAdmin(ctx, project.orgId);
    if (isFailure(authResult)) return authResult;

    const secrets = await ctx.db
      .query("secrets")
      .withIndex("by_environment", (q) => q.eq("environmentId", args.id))
      .collect();

    for (const secret of secrets) {
      await ctx.db.delete(secret._id);
    }

    await ctx.db.delete(args.id);

    return success({ deleted: true });
  },
});
