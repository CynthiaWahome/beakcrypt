import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

export default defineSchema({
  waitlist: defineTable({
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
