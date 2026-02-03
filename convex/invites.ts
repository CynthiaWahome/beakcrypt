import { roles } from "./schema";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    email: v.string(),
    role: roles,
    token: v.string(),
    expiresAt: v.number(),
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
      throw new Error("Not a member of this organization");
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("Insufficient permissions to invite members");
    }

    const existingInvite = await ctx.db
      .query("invites")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingInvite && existingInvite.status === "pending") {
      throw new Error("A pending invite already exists for this email");
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
      throw new Error("Invite not found");
    }

    return invite;
  },
});

export const accept = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.status !== "pending") {
      throw new Error("Invite is no longer valid");
    }

    if (invite.expiresAt < Date.now()) {
      throw new Error("Invite has expired");
    }

    const user = await authComponent.getAuthUser(ctx).catch(() => null);
    if (!user) {
      throw new Error("Unable to perform this action");
    }

    if (invite.email !== user.email) {
      throw new Error("This invite was sent to a different email address");
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", invite.orgId).eq("userId", user._id),
      )
      .first();

    if (membership) {
      throw new Error("You are already a member of this organization");
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
    if (!org) throw new Error("Organization not found");

    return org.slug;
  },
});

export const decline = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx).catch(() => null);

    if (!user) {
      throw new Error("Unable to perform this action");
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.email !== user.email) {
      throw new Error("This invite was sent to a different email address");
    }

    if (invite.status !== "pending") {
      throw new Error("Invite is no longer valid");
    }

    if (invite.expiresAt < Date.now()) {
      throw new Error("Invite has expired");
    }

    await ctx.db.patch(invite._id, {
      status: "declined",
      updatedAt: Date.now(),
    });

    return invite.orgId;
  },
});

export const getInvite = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (
      !invite ||
      invite.status !== "pending" ||
      invite.expiresAt < Date.now()
    ) {
      return null;
    }

    const org = await ctx.db.get(invite.orgId);
    if (!org) return null;

    return {
      orgName: org.name,
      orgSlug: org.slug,
      role: invite.role,
      email: invite.email,
      orgAvatar: org.avatar,
    };
  },
});
