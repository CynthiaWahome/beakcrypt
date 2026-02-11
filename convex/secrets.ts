import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { Result, success, failure, HttpStatus, isFailure } from "./types";
import { getAuthUser, requireOrgAdmin, requireOrgMember } from "./authHelpers";

export const list = query({
  args: {
    environmentId: v.id("environments"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"secrets">[]>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const environment = await ctx.db.get(args.environmentId);
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

    const authResult = await requireOrgMember(ctx, project.orgId);
    if (isFailure(authResult)) return authResult;

    const secrets = await ctx.db
      .query("secrets")
      .withIndex("by_environment", (q) =>
        q.eq("environmentId", args.environmentId),
      )
      .collect();

    return success(secrets);
  },
});

export const create = mutation({
  args: {
    environmentId: v.id("environments"),
    key: v.string(),
    encryptedValue: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"secrets">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const environment = await ctx.db.get(args.environmentId);
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

    const existing = await ctx.db
      .query("secrets")
      .withIndex("by_env_and_key", (q) =>
        q.eq("environmentId", args.environmentId).eq("key", args.key),
      )
      .first();

    if (existing) {
      return failure(
        HttpStatus.CONFLICT,
        "secret:key_taken",
        "A secret with this key already exists",
      );
    }

    const secretId = await ctx.db.insert("secrets", {
      key: args.key,
      encryptedValue: args.encryptedValue,
      environmentId: args.environmentId,
      createdBy: authResult.data.user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const secret = await ctx.db.get(secretId);
    if (!secret) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "secret:create_failed",
        "Failed to create secret",
      );
    }

    return success(secret, HttpStatus.CREATED);
  },
});

export const update = mutation({
  args: {
    id: v.id("secrets"),
    key: v.optional(v.string()),
    encryptedValue: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Result<Doc<"secrets">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const secret = await ctx.db.get(args.id);
    if (!secret) {
      return failure(
        HttpStatus.NOT_FOUND,
        "secret:not_found",
        "Secret not found",
      );
    }

    const environment = await ctx.db.get(secret.environmentId);
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

    if (args.key !== undefined && args.key !== secret.key) {
      const newKey = args.key;
      const existing = await ctx.db
        .query("secrets")
        .withIndex("by_env_and_key", (q) =>
          q.eq("environmentId", secret.environmentId).eq("key", newKey),
        )
        .first();

      if (existing) {
        return failure(
          HttpStatus.CONFLICT,
          "secret:key_taken",
          "A secret with this key already exists",
        );
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.key !== undefined && { key: args.key }),
      ...(args.encryptedValue !== undefined && {
        encryptedValue: args.encryptedValue,
      }),
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.id);
    if (!updated) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "secret:update_failed",
        "Failed to update secret",
      );
    }

    return success(updated);
  },
});

export const remove = mutation({
  args: {
    id: v.id("secrets"),
  },
  handler: async (ctx, args): Promise<Result<{ deleted: true }>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const secret = await ctx.db.get(args.id);
    if (!secret) {
      return failure(
        HttpStatus.NOT_FOUND,
        "secret:not_found",
        "Secret not found",
      );
    }

    const environment = await ctx.db.get(secret.environmentId);
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

    await ctx.db.delete(args.id);

    return success({ deleted: true });
  },
});

export const removeAll = mutation({
  args: {
    environmentId: v.id("environments"),
  },
  handler: async (ctx, args): Promise<Result<{ deleted: number }>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const environment = await ctx.db.get(args.environmentId);
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
      .withIndex("by_environment", (q) =>
        q.eq("environmentId", args.environmentId),
      )
      .collect();

    for (const secret of secrets) {
      await ctx.db.delete(secret._id);
    }

    return success({ deleted: secrets.length });
  },
});

type BulkCreateResult = {
  created: number;
  updated: number;
  skipped: number;
};

export const bulkCreate = mutation({
  args: {
    environmentId: v.id("environments"),
    secrets: v.array(
      v.object({
        key: v.string(),
        encryptedValue: v.string(),
      }),
    ),
    overwrite: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Result<BulkCreateResult>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const environment = await ctx.db.get(args.environmentId);
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

    const results: BulkCreateResult = {
      created: 0,
      updated: 0,
      skipped: 0,
    };

    for (const secret of args.secrets) {
      const existing = await ctx.db
        .query("secrets")
        .withIndex("by_env_and_key", (q) =>
          q.eq("environmentId", args.environmentId).eq("key", secret.key),
        )
        .first();

      if (existing) {
        if (args.overwrite) {
          await ctx.db.patch(existing._id, {
            encryptedValue: secret.encryptedValue,
            updatedAt: Date.now(),
          });
          results.updated++;
        } else {
          results.skipped++;
        }
      } else {
        await ctx.db.insert("secrets", {
          key: secret.key,
          encryptedValue: secret.encryptedValue,
          environmentId: args.environmentId,
          createdBy: authResult.data.user._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.created++;
      }
    }

    return success(results);
  },
});

type SyncResult = {
  created: number;
  updated: number;
  skipped: number;
};

export const syncFromEnvironment = mutation({
  args: {
    sourceEnvironmentId: v.id("environments"),
    targetEnvironmentId: v.id("environments"),
    overwrite: v.boolean(),
  },
  handler: async (ctx, args): Promise<Result<SyncResult>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const sourceEnv = await ctx.db.get(args.sourceEnvironmentId);
    if (!sourceEnv) {
      return failure(
        HttpStatus.NOT_FOUND,
        "env:source_not_found",
        "Source environment not found",
      );
    }

    const targetEnv = await ctx.db.get(args.targetEnvironmentId);
    if (!targetEnv) {
      return failure(
        HttpStatus.NOT_FOUND,
        "env:target_not_found",
        "Target environment not found",
      );
    }

    if (sourceEnv.projectId !== targetEnv.projectId) {
      return failure(
        HttpStatus.BAD_REQUEST,
        "env:project_mismatch",
        "Environments must be in the same project",
      );
    }

    const project = await ctx.db.get(sourceEnv.projectId);
    if (!project) {
      return failure(
        HttpStatus.NOT_FOUND,
        "project:not_found",
        "Project not found",
      );
    }

    const authResult = await requireOrgAdmin(ctx, project.orgId);
    if (isFailure(authResult)) return authResult;

    const sourceSecrets = await ctx.db
      .query("secrets")
      .withIndex("by_environment", (q) =>
        q.eq("environmentId", args.sourceEnvironmentId),
      )
      .collect();

    const results: SyncResult = {
      created: 0,
      updated: 0,
      skipped: 0,
    };

    for (const secret of sourceSecrets) {
      const existing = await ctx.db
        .query("secrets")
        .withIndex("by_env_and_key", (q) =>
          q.eq("environmentId", args.targetEnvironmentId).eq("key", secret.key),
        )
        .first();

      if (existing) {
        if (args.overwrite) {
          await ctx.db.patch(existing._id, {
            encryptedValue: secret.encryptedValue,
            updatedAt: Date.now(),
          });
          results.updated++;
        } else {
          results.skipped++;
        }
      } else {
        await ctx.db.insert("secrets", {
          key: secret.key,
          encryptedValue: secret.encryptedValue,
          environmentId: args.targetEnvironmentId,
          createdBy: authResult.data.user._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.created++;
      }
    }

    return success(results);
  },
});

export const listAllOrgSecrets = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (
    ctx,
    args,
  ): Promise<Result<Array<{ secretId: string; encryptedValue: string }>>> => {
    const authResult = await requireOrgAdmin(ctx, args.orgId);
    if (isFailure(authResult)) return authResult;

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const allSecrets: Array<{ secretId: string; encryptedValue: string }> = [];

    for (const project of projects) {
      const environments = await ctx.db
        .query("environments")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();

      for (const env of environments) {
        const secrets = await ctx.db
          .query("secrets")
          .withIndex("by_environment", (q) => q.eq("environmentId", env._id))
          .collect();

        for (const secret of secrets) {
          allSecrets.push({
            secretId: secret._id,
            encryptedValue: secret.encryptedValue,
          });
        }
      }
    }

    return success(allSecrets);
  },
});
