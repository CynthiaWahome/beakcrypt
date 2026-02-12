import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { Result, success, failure, HttpStatus, isFailure } from "./types";
import { getAuthUser, requireOrgAdmin, requireOrgMember } from "./authHelpers";

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
  handler: async (ctx, args): Promise<Result<Doc<"projects">>> => {
    const authResult = await requireOrgAdmin(ctx, args.orgId);
    if (isFailure(authResult)) return authResult;

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", args.orgId).eq("name", args.name),
      )
      .first();

    if (existing) {
      return failure(
        HttpStatus.CONFLICT,
        "project:name_taken",
        "A project with this name already exists",
      );
    }

    if (args.githubRepoId) {
      const existingRepo = await ctx.db
        .query("projects")
        .withIndex("by_github_repo", (q) =>
          q.eq("githubRepoId", args.githubRepoId),
        )
        .first();

      if (existingRepo) {
        return failure(
          HttpStatus.CONFLICT,
          "project:repo_imported",
          "This repository is already imported",
        );
      }
    }

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      orgId: args.orgId,
      createdBy: authResult.data.user._id,
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

    const project = await ctx.db.get(projectId);
    if (!project) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "project:create_failed",
        "Failed to create project",
      );
    }

    return success(project, HttpStatus.CREATED);
  },
});

export const getByName = query({
  args: {
    name: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"projects">>> => {
    const authResult = await requireOrgMember(ctx, args.orgId);
    if (isFailure(authResult)) return authResult;

    const project = await ctx.db
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", args.orgId).eq("name", args.name),
      )
      .first();

    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    return success(project);
  },
});

export const getBySlugAndName = query({
  args: {
    orgSlug: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"projects">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgSlug))
      .first();

    if (!org) {
      return failure(
        HttpStatus.NOT_FOUND,
        "org:not_found",
        "Organization not found",
      );
    }

    const authResult = await requireOrgMember(ctx, org._id);
    if (isFailure(authResult)) return authResult;

    const project = await ctx.db
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", org._id).eq("name", args.name),
      )
      .first();

    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    return success(project);
  },
});

export const checkName = query({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
  },
  handler: async (ctx, args): Promise<Result<boolean>> => {
    const authResult = await requireOrgMember(ctx, args.orgId);
    if (isFailure(authResult)) return authResult;

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", args.orgId).eq("name", args.name),
      )
      .first();

    return success(!!existing);
  },
});

export const list = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"projects">[]>> => {
    const authResult = await requireOrgMember(ctx, args.orgId);
    if (isFailure(authResult)) return authResult;

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return success(projects);
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"projects">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const project = await ctx.db.get(args.id);
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
      .query("projects")
      .withIndex("by_org_and_name", (q) =>
        q.eq("orgId", project.orgId).eq("name", args.name),
      )
      .first();

    if (existing && existing._id !== args.id) {
      return failure(
        HttpStatus.CONFLICT,
        "project:name_taken",
        "A project with this name already exists",
      );
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.id);
    if (!updated) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "project:update_failed",
        "Failed to update project",
      );
    }

    return success(updated);
  },
});

export const linkRepo = mutation({
  args: {
    id: v.id("projects"),
    githubRepoId: v.number(),
    githubRepoUrl: v.string(),
    githubRepoName: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"projects">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const project = await ctx.db.get(args.id);
    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    const authResult = await requireOrgAdmin(ctx, project.orgId);
    if (isFailure(authResult)) return authResult;

    const existingRepo = await ctx.db
      .query("projects")
      .withIndex("by_github_repo", (q) =>
        q.eq("githubRepoId", args.githubRepoId),
      )
      .first();

    if (existingRepo && existingRepo._id !== args.id) {
      return failure(
        HttpStatus.CONFLICT,
        "project:repo_imported",
        "This repository is already linked to another project",
      );
    }

    await ctx.db.patch(args.id, {
      githubRepoId: args.githubRepoId,
      githubRepoUrl: args.githubRepoUrl,
      githubRepoName: args.githubRepoName,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.id);
    if (!updated) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "project:link_failed",
        "Failed to link repository",
      );
    }

    return success(updated);
  },
});

export const unlinkRepo = mutation({
  args: {
    id: v.id("projects"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"projects">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const project = await ctx.db.get(args.id);
    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    const authResult = await requireOrgAdmin(ctx, project.orgId);
    if (isFailure(authResult)) return authResult;

    await ctx.db.patch(args.id, {
      githubRepoId: undefined,
      githubRepoUrl: undefined,
      githubRepoName: undefined,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.id);
    if (!updated) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "project:unlink_failed",
        "Failed to unlink repository",
      );
    }

    return success(updated);
  },
});

export const remove = mutation({
  args: {
    id: v.id("projects"),
  },
  handler: async (ctx, args): Promise<Result<{ deleted: true }>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const project = await ctx.db.get(args.id);
    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    const authResult = await requireOrgAdmin(ctx, project.orgId);
    if (isFailure(authResult)) return authResult;

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

    return success({ deleted: true });
  },
});
