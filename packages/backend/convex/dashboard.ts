import { v } from "convex/values";

import { query } from "./_generated/server";

export const getStats = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Get total memories count
    const memories = await ctx.db
      .query("memories")
      .withIndex("organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
    const totalMemories = memories.length;

    // Get total agents count
    const agents = await ctx.db
      .query("agents")
      .withIndex("organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
    const totalAgents = agents.length;

    // Get total sessions count
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
    const sessionCount = sessions.length;

    // Get token usage from organization plan
    const planDoc = await ctx.db
      .query("organizationPlans")
      .withIndex("organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .first();

    const tokenUsage = planDoc?.tokensUsed ?? 0;
    const tokenLimit = planDoc?.tokensLimit ?? 500_000;

    return {
      totalMemories,
      totalAgents,
      sessionCount,
      tokenUsage,
      tokenLimit,
    };
  },
});

export const getRecentMemories = query({
  args: {
    organizationId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit ?? 5;

    const memories = await ctx.db
      .query("memories")
      .withIndex("organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(limit);

    // Get agent names for each memory
    const agentIds = [...new Set(memories.map((m) => m.agentId))];
    const agents = await Promise.all(
      agentIds.map((id) => ctx.db.get(id))
    );
    const agentMap = Object.fromEntries(
      agents.filter(Boolean).map((a) => [a!._id, a!.name])
    );

    return memories.map((m) => ({
      _id: m._id,
      content: m.content.slice(0, 100) + (m.content.length > 100 ? "..." : ""),
      type: m.memoryType ?? "unknown",
      agentName: agentMap[m.agentId] ?? "Unknown",
      createdAt: m.createdAt,
    }));
  },
});

export const getAgentStatus = query({
  args: {
    organizationId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit ?? 4;

    const agents = await ctx.db
      .query("agents")
      .withIndex("organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(limit);

    // Get memory count and last activity for each agent
    const agentData = await Promise.all(
      agents.map(async (agent) => {
        const memories = await ctx.db
          .query("memories")
          .withIndex("agentId", (q) => q.eq("agentId", agent._id))
          .collect();

        const lastMemory = memories.length > 0
          ? Math.max(...memories.map((m) => m.createdAt))
          : null;

        return {
          _id: agent._id,
          name: agent.name,
          connected: agent.status === "connected",
          memoryCount: memories.length,
          lastActive: lastMemory,
        };
      })
    );

    return agentData;
  },
});
