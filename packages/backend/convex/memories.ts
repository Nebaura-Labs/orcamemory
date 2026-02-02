import { v } from "convex/values"

import { query, mutation } from "./_generated/server"

export const getById = query({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const memory = await ctx.db.get(args.memoryId)
    if (!memory) {
      return null
    }

    // Verify user has access via project ownership
    const project = await ctx.db.get(memory.projectId)
    if (!project || project.createdBy !== identity.subject) {
      throw new Error("Access denied")
    }

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

    // Verify user has access via project ownership
    const project = await ctx.db.get(memory.projectId)
    if (!project || project.createdBy !== identity.subject) {
      throw new Error("Access denied")
    }

    await ctx.db.delete(args.memoryId)
    return { success: true }
  },
})
