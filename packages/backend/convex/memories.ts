import { v } from "convex/values"

import { query, mutation } from "./_generated/server"

// Helper to verify user has access to the organization
async function verifyOrganizationAccess(
  ctx: { db: any; auth: any },
  organizationId: string
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Unauthorized")
  }

  const userId = identity.subject

  // Check if user is a member of the organization
  const membership = await ctx.db
    .query("member")
    .withIndex("organizationId", (q: any) => q.eq("organizationId", organizationId))
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .first()

  if (!membership) {
    throw new Error("Access denied: not a member of this organization")
  }

  return userId
}

export const getById = query({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const memory = await ctx.db.get(args.memoryId)
    if (!memory) {
      return null
    }

    // Verify user has access to this memory's organization
    await verifyOrganizationAccess(ctx, memory.organizationId)

    const agent = await ctx.db.get(memory.agentId)

    // Get session info if available
    let session = null
    let sessionEvent = null
    if (memory.sessionId) {
      session = await ctx.db.get(memory.sessionId)

      // Find the session event created around the same time as this memory
      const events = await ctx.db
        .query("sessionEvents")
        .withIndex("sessionId", (q) => q.eq("sessionId", memory.sessionId!))
        .collect()

      // Find the event closest to memory creation time (within 5 seconds)
      sessionEvent =
        events.find((e) => Math.abs(e.createdAt - memory.createdAt) < 5000) ?? null
    }

    // Get usage log for this memory (embedding tokens)
    const usageLogs = await ctx.db
      .query("usageLogs")
      .withIndex("projectId", (q) => q.eq("projectId", memory.projectId))
      .collect()

    const usageLog = usageLogs.find((log) => log.memoryId === memory._id) ?? null

    return {
      ...memory,
      agentName: agent?.name ?? "Unknown",
      session: session
        ? {
            name: session.name,
            model: session.model ?? null,
            startedAt: session.startedAt,
          }
        : null,
      sessionEvent: sessionEvent
        ? {
            kind: sessionEvent.kind,
            model: sessionEvent.model ?? null,
            tokensPrompt: sessionEvent.tokensPrompt ?? null,
            tokensCompletion: sessionEvent.tokensCompletion ?? null,
            tokensTotal: sessionEvent.tokensTotal ?? null,
          }
        : null,
      usage: usageLog
        ? {
            kind: usageLog.kind,
            tokens: usageLog.tokens,
            searches: usageLog.searches,
          }
        : null,
    }
  },
})

export const deleteMemory = mutation({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const memory = await ctx.db.get(args.memoryId)
    if (!memory) {
      throw new Error("Memory not found")
    }

    // Verify user has access to this memory's organization
    await verifyOrganizationAccess(ctx, memory.organizationId)

    await ctx.db.delete(args.memoryId)
    return { success: true }
  },
})
