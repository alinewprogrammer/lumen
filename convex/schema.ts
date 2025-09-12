import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 😉 Users synced from Clerk
  users: defineTable({
    userId: v.string(), // Clerk user ID
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),
});