import { roles } from "./schema";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { Result, success, failure, HttpStatus, isFailure } from "./types";
import { getAuthUser, requireOrgAdmin } from "./authHelpers";

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    email: v.string(),
    role: roles,
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"invites">>> => {
    const authResult = await requireOrgAdmin(ctx, args.orgId);
    if (isFailure(authResult)) return authResult;

    const { user } = authResult.data;

    const existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingInvite && existingInvite.status === "pending") {
      return failure(
        HttpStatus.CONFLICT,
        "invite:already_exists",
        "A pending invite already exists for this email",
      );
    }

    const inviteId = await ctx.db.insert("invites", {
      orgId: args.orgId,
      email: args.email,
      role: args.role,
      token: args.token,
      inviterId: user._id,
      expiresAt: args.expiresAt,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const org = await ctx.db.get(args.orgId);

    if (org) {
      await ctx.scheduler.runAfter(0, internal.mail.sendInviteMail, {
        email: args.email,
        orgName: org.name,
        invitedByEmail: user.email,
        url: `${process.env.SITE_URL}/auth/invite?token=${args.token}`,
      });
    }

    const invite = await ctx.db.get(inviteId);

    if (!invite) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "invite:create_failed",
        "Failed to create invite",
      );
    }

    return success(invite, HttpStatus.CREATED);
  },
});

export const accept = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"organizations">>> => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      return failure(
        HttpStatus.NOT_FOUND,
        "invite:not_found",
        "Invite not found",
      );
    }

    if (invite.status !== "pending") {
      return failure(
        HttpStatus.BAD_REQUEST,
        "invite:invalid",
        "Invite is no longer valid",
      );
    }

    if (invite.expiresAt < Date.now()) {
      return failure(
        HttpStatus.BAD_REQUEST,
        "invite:expired",
        "Invite has expired",
      );
    }

    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const user = userResult.data;

    if (invite.email !== user.email) {
      return failure(
        HttpStatus.FORBIDDEN,
        "invite:email_mismatch",
        "This invite was sent to a different email address",
      );
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", invite.orgId).eq("userId", user._id),
      )
      .first();

    if (membership) {
      return failure(
        HttpStatus.CONFLICT,
        "invite:already_member",
        "You are already a member of this organization",
      );
    }

    await ctx.db.insert("organizationMembers", {
      orgId: invite.orgId,
      userId: user._id,
      role: invite.role,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.patch(invite._id, {
      status: "accepted",
      updatedAt: Date.now(),
    });

    const org = await ctx.db.get(invite.orgId);
    if (!org) {
      return failure(
        HttpStatus.NOT_FOUND,
        "org:not_found",
        "Organization not found",
      );
    }

    return success(org);
  },
});

export const decline = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args): Promise<Result<Doc<"invites">>> => {
    const userResult = await getAuthUser(ctx);
    if (isFailure(userResult)) return userResult;

    const user = userResult.data;

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      return failure(
        HttpStatus.NOT_FOUND,
        "invite:not_found",
        "Invite not found",
      );
    }

    if (invite.email !== user.email) {
      return failure(
        HttpStatus.FORBIDDEN,
        "invite:email_mismatch",
        "This invite was sent to a different email address",
      );
    }

    if (invite.status !== "pending") {
      return failure(
        HttpStatus.BAD_REQUEST,
        "invite:invalid",
        "Invite is no longer valid",
      );
    }

    if (invite.expiresAt < Date.now()) {
      return failure(
        HttpStatus.BAD_REQUEST,
        "invite:expired",
        "Invite has expired",
      );
    }

    await ctx.db.patch(invite._id, {
      status: "declined",
      updatedAt: Date.now(),
    });

    const updatedInvite = await ctx.db.get(invite._id);

    if (!updatedInvite) {
      return failure(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "invite:update_failed",
        "Failed to decline invite",
      );
    }

    return success(updatedInvite);
  },
});

export const getInvite = query({
  args: {
    token: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<
    Result<{
      invite: Doc<"invites">;
      organization: Doc<"organizations">;
    }>
  > => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (
      !invite ||
      invite.status !== "pending" ||
      invite.expiresAt < Date.now()
    ) {
      return failure(
        HttpStatus.BAD_REQUEST,
        "invite:invalid",
        "Invite is no longer valid",
      );
    }

    const org = await ctx.db.get(invite.orgId);
    if (!org) {
      return failure(
        HttpStatus.NOT_FOUND,
        "organization:not_found",
        "Organization not found",
      );
    }

    return success({
      invite,
      organization: org,
    });
  },
});
