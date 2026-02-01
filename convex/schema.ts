import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export const roles = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
);

export default defineSchema({
  waitlists: defineTable({
    email: v.string(),
    createdAt: v.optional(v.number()),
  }).index("by_email", ["email"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.string(),
    avatar: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  organizationMembers: defineTable({
    orgId: v.id("organizations"),
    userId: v.string(),
    role: roles,
    createdAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_org_and_user", ["orgId", "userId"]),

  invites: defineTable({
    orgId: v.id("organizations"),
    email: v.string(),
    role: roles,
    token: v.string(),
    inviterId: v.string(),
    expiresAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked"),
    ),
    createdAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_token", ["token"])
    .index("by_email", ["email"]),
});
