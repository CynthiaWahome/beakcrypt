import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { Result, success, failure, HttpStatus, isFailure } from "./types";
import { getAuthUser, requireOrgAdmin, requireOrgMember } from "./authHelpers";
import { authComponent, createAuth } from "./auth";

export const registerKey = mutation({
  args: {
    orgId: v.id("organizations"),
    publicKey: v.string(),
    wrappedOrgKey: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"memberKeys">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const user = userResult.data;

    const membershipResult = await requireOrgMember(ctx, args.orgId);
    if (isFailure(membershipResult)) return membershipResult;

    const org = await ctx.db.get(args.orgId);
    if (!org) {
      return failure(
        HttpStatus.NOT_FOUND,
        "org:not_found",
        "Organization not found",
      );
    }

    const isOwner = org.ownerId === user._id;
    const status = isOwner && args.wrappedOrgKey ? "active" : "pending";

    const keyId = await ctx.db.insert("memberKeys", {
      orgId: args.orgId,
      userId: user._id,
      publicKey: args.publicKey,
      wrappedOrgKey: isOwner ? args.wrappedOrgKey : undefined,
      sessionToken: args.sessionToken,
      status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const record = await ctx.db.get(keyId);
    if (!record) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "key:create_failed",
        "Failed to register key",
      );
    }

    return success(record, HttpStatus.CREATED);
  },
});

export const approveKey = mutation({
  args: {
    keyId: v.id("memberKeys"),
    wrappedOrgKey: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"memberKeys">>> => {
    const memberKey = await ctx.db.get(args.keyId);
    if (!memberKey) {
      return failure(
        HttpStatus.NOT_FOUND,
        "key:not_found",
        "Key record not found",
      );
    }

    const authResult = await requireOrgAdmin(ctx, memberKey.orgId);
    if (isFailure(authResult)) return authResult;

    if (memberKey.status !== "pending") {
      return failure(
        HttpStatus.BAD_REQUEST,
        "key:not_pending",
        "Only pending keys can be approved",
      );
    }

    await ctx.db.patch(args.keyId, {
      wrappedOrgKey: args.wrappedOrgKey,
      status: "active",
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.keyId);
    if (!updated) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "key:approve_failed",
        "Failed to approve key",
      );
    }

    return success(updated);
  },
});

export const revokeKey = mutation({
  args: {
    keyId: v.id("memberKeys"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"memberKeys">>> => {
    const memberKey = await ctx.db.get(args.keyId);
    if (!memberKey) {
      return failure(
        HttpStatus.NOT_FOUND,
        "key:not_found",
        "Key record not found",
      );
    }

    const authResult = await requireOrgAdmin(ctx, memberKey.orgId);
    if (isFailure(authResult)) return authResult;

    if (memberKey.status === "revoked") {
      return failure(
        HttpStatus.BAD_REQUEST,
        "key:already_revoked",
        "Key is already revoked",
      );
    }

    await ctx.db.patch(args.keyId, {
      status: "revoked",
      wrappedOrgKey: undefined,
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.keyId);
    if (!updated) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "key:revoke_failed",
        "Failed to revoke key",
      );
    }

    return success(updated);
  },
});

export const getMyKey = query({
  args: {
    orgId: v.id("organizations"),
    publicKey: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"memberKeys"> | null>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const membershipResult = await requireOrgMember(ctx, args.orgId);
    if (isFailure(membershipResult)) return membershipResult;

    const keys = await ctx.db
      .query("memberKeys")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", userResult.data._id),
      )
      .collect();

    const matchingKey =
      keys.find((k) => k.publicKey === args.publicKey) ?? null;

    return success(matchingKey);
  },
});

export const listPendingKeys = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"memberKeys">[]>> => {
    const authResult = await requireOrgAdmin(ctx, args.orgId);
    if (isFailure(authResult)) return authResult;

    const pendingKeys = await ctx.db
      .query("memberKeys")
      .withIndex("by_org_and_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", "pending"),
      )
      .collect();

    return success(pendingKeys);
  },
});

export const getPublicKey = query({
  args: {
    keyId: v.id("memberKeys"),
  },
  handler: async (ctx, args): Promise<Result<{ publicKey: string }>> => {
    const memberKey = await ctx.db.get(args.keyId);
    if (!memberKey) {
      return failure(
        HttpStatus.NOT_FOUND,
        "key:not_found",
        "Key record not found",
      );
    }

    const authResult = await requireOrgMember(ctx, memberKey.orgId);
    if (isFailure(authResult)) return authResult;

    return success({ publicKey: memberKey.publicKey });
  },
});

export const listActiveKeys = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"memberKeys">[]>> => {
    const authResult = await requireOrgAdmin(ctx, args.orgId);
    if (isFailure(authResult)) return authResult;

    const activeKeys = await ctx.db
      .query("memberKeys")
      .withIndex("by_org_and_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", "active"),
      )
      .collect();

    return success(activeKeys);
  },
});

export const rotateOrgKey = mutation({
  args: {
    orgId: v.id("organizations"),
    wrappedKeys: v.array(
      v.object({
        keyId: v.id("memberKeys"),
        wrappedOrgKey: v.string(),
      }),
    ),
    reEncryptedSecrets: v.array(
      v.object({
        secretId: v.id("secrets"),
        encryptedValue: v.string(),
      }),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<Result<{ keysUpdated: number; secretsUpdated: number }>> => {
    const authResult = await requireOrgAdmin(ctx, args.orgId);
    if (isFailure(authResult)) return authResult;

    let keysUpdated = 0;
    for (const wk of args.wrappedKeys) {
      const key = await ctx.db.get(wk.keyId);
      if (!key || key.orgId !== args.orgId || key.status !== "active") continue;

      await ctx.db.patch(wk.keyId, {
        wrappedOrgKey: wk.wrappedOrgKey,
        updatedAt: Date.now(),
      });
      keysUpdated++;
    }

    let secretsUpdated = 0;
    for (const rs of args.reEncryptedSecrets) {
      const secret = await ctx.db.get(rs.secretId);
      if (!secret) continue;

      const env = await ctx.db.get(secret.environmentId);
      if (!env) continue;
      const project = await ctx.db.get(env.projectId);
      if (!project || project.orgId !== args.orgId) continue;

      await ctx.db.patch(rs.secretId, {
        encryptedValue: rs.encryptedValue,
        updatedAt: Date.now(),
      });
      secretsUpdated++;
    }

    return success({
      keysUpdated,
      secretsUpdated,
    });
  },
});

export const listMySessions = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args): Promise<Result<Doc<"memberKeys">[]>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const membershipResult = await requireOrgMember(ctx, args.orgId);
    if (isFailure(membershipResult)) return membershipResult;

    const keys = await ctx.db
      .query("memberKeys")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", userResult.data._id),
      )
      .collect();

    return success(keys);
  },
});

export const approveMySession = mutation({
  args: {
    keyId: v.id("memberKeys"),
    wrappedOrgKey: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"memberKeys">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const memberKey = await ctx.db.get(args.keyId);
    if (!memberKey) {
      return failure(
        HttpStatus.NOT_FOUND,
        "key:not_found",
        "Key record not found",
      );
    }

    const membershipResult = await requireOrgMember(ctx, memberKey.orgId);
    if (isFailure(membershipResult)) return membershipResult;

    if (memberKey.userId !== userResult.data._id) {
      return failure(
        HttpStatus.FORBIDDEN,
        "key:not_owner",
        "You can only approve your own device sessions",
      );
    }

    if (memberKey.status !== "pending") {
      return failure(
        HttpStatus.BAD_REQUEST,
        "key:not_pending",
        "Only pending keys can be approved",
      );
    }

    await ctx.db.patch(args.keyId, {
      wrappedOrgKey: args.wrappedOrgKey,
      status: "active",
      updatedAt: Date.now(),
    });

    const updated = await ctx.db.get(args.keyId);
    if (!updated) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "key:approve_failed",
        "Failed to approve session",
      );
    }

    return success(updated);
  },
});

export const revokeMySession = mutation({
  args: {
    keyId: v.id("memberKeys"),
  },
  handler: async (ctx, args): Promise<Result<null>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const memberKey = await ctx.db.get(args.keyId);
    if (!memberKey) {
      return failure(
        HttpStatus.NOT_FOUND,
        "key:not_found",
        "Key record not found",
      );
    }

    const membershipResult = await requireOrgMember(ctx, memberKey.orgId);
    if (isFailure(membershipResult)) return membershipResult;

    if (memberKey.userId !== userResult.data._id) {
      return failure(
        HttpStatus.FORBIDDEN,
        "key:not_owner",
        "You can only revoke your own device sessions",
      );
    }

    await ctx.db.delete(args.keyId);

    if (memberKey.sessionToken) {
      try {
        const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
        await auth.api.revokeSession({
          body: { token: memberKey.sessionToken },
          headers,
        });
      } catch (e) {
        console.error("Failed to revoke Better Auth session:", e);
      }
    }

    return success(null);
  },
});
