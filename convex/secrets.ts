import { v } from "convex/values";
import { authComponent } from "./auth";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    environmentId: v.id("environments"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      return [];
    }

    const environment = await ctx.db.get(args.environmentId);
    if (!environment) {
      return [];
    }

    const project = await ctx.db.get(environment.projectId);
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

    const secrets = await ctx.db
      .query("secrets")
      .withIndex("by_environment", (q) =>
        q.eq("environmentId", args.environmentId),
      )
      .collect();

    return secrets;
  },
});

export const create = mutation({
  args: {
    environmentId: v.id("environments"),
    key: v.string(),
    encryptedValue: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const environment = await ctx.db.get(args.environmentId);
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

    const existing = await ctx.db
      .query("secrets")
      .withIndex("by_env_and_key", (q) =>
        q.eq("environmentId", args.environmentId).eq("key", args.key),
      )
      .first();

    if (existing) {
      throw new Error("A secret with this key already exists");
    }

    const secretId = await ctx.db.insert("secrets", {
      key: args.key,
      encryptedValue: args.encryptedValue,
      environmentId: args.environmentId,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(secretId);
  },
});

export const update = mutation({
  args: {
    id: v.id("secrets"),
    key: v.optional(v.string()),
    encryptedValue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const secret = await ctx.db.get(args.id);
    if (!secret) {
      throw new Error("Secret not found");
    }

    const environment = await ctx.db.get(secret.environmentId);
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

    if (args.key && args.key !== secret.key) {
      const existing = await ctx.db
        .query("secrets")
        .withIndex("by_env_and_key", (q) =>
          q.eq("environmentId", secret.environmentId).eq("key", args.key!),
        )
        .first();

      if (existing) {
        throw new Error("A secret with this key already exists");
      }
    }

    await ctx.db.patch(args.id, {
      ...(args.key && { key: args.key }),
      ...(args.encryptedValue !== undefined && {
        encryptedValue: args.encryptedValue,
      }),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: {
    id: v.id("secrets"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const secret = await ctx.db.get(args.id);
    if (!secret) {
      throw new Error("Secret not found");
    }

    const environment = await ctx.db.get(secret.environmentId);
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

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

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
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const environment = await ctx.db.get(args.environmentId);
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

    const results = {
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
          createdBy: user._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.created++;
      }
    }

    return results;
  },
});

export const syncFromEnvironment = mutation({
  args: {
    sourceEnvironmentId: v.id("environments"),
    targetEnvironmentId: v.id("environments"),
    overwrite: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const sourceEnv = await ctx.db.get(args.sourceEnvironmentId);
    if (!sourceEnv) {
      throw new Error("Source environment not found");
    }
    const targetEnv = await ctx.db.get(args.targetEnvironmentId);
    if (!targetEnv) {
      throw new Error("Target environment not found");
    }

    if (sourceEnv.projectId !== targetEnv.projectId) {
      throw new Error("Environments must be in the same project");
    }

    const project = await ctx.db.get(sourceEnv.projectId);
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

    const sourceSecrets = await ctx.db
      .query("secrets")
      .withIndex("by_environment", (q) =>
        q.eq("environmentId", args.sourceEnvironmentId),
      )
      .collect();

    const results = {
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
          createdBy: user._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.created++;
      }
    }

    return results;
  },
});
