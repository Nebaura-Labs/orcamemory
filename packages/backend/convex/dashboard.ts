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

export const searchMemories = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
    agentId: v.optional(v.id("agents")),
    memoryType: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const limit = Math.min(args.limit ?? 50, 100);
    const searchLower = args.search?.toLowerCase().trim() ?? "";

    const memoriesQuery = ctx.db
      .query("memories")
      .withIndex("projectId_createdAt", (q) => q.eq("projectId", args.projectId))
      .order("desc");

    const allMemories = await memoriesQuery.collect();

    // Filter in memory
    let filtered = allMemories;

    if (args.agentId) {
      filtered = filtered.filter((m) => m.agentId === args.agentId);
    }

    if (args.memoryType) {
      filtered = filtered.filter((m) => m.memoryType === args.memoryType);
    }

    if (searchLower) {
      filtered = filtered.filter((m) =>
        m.content.toLowerCase().includes(searchLower)
      );
    }

    // Take limited results
    const page = filtered.slice(0, limit);
    const nextCursor = page.length === limit ? page[page.length - 1]._id : null;

    // Get agent names
    const agentIds = [...new Set(page.map((m) => m.agentId))];
    const agents = await Promise.all(agentIds.map((id) => ctx.db.get(id)));
    const agentMap = Object.fromEntries(
      agents.filter(Boolean).map((a) => [a!._id, a!.name])
    );

    return {
      memories: page.map((m) => ({
        _id: m._id,
        content: m.content,
        tags: m.tags,
        memoryType: m.memoryType ?? null,
        metadata: m.metadata ?? null,
        agentId: m.agentId,
        agentName: agentMap[m.agentId] ?? "Unknown",
        createdAt: m.createdAt,
      })),
      nextCursor,
      total: filtered.length,
    };
  },
});

export const getMemoryTypes = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    return project.memoryTypes;
  },
});

export const getAgentsForProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const agents = await ctx.db
      .query("agents")
      .withIndex("projectId", (q) => q.eq("projectId", args.projectId))
      .collect();

    return agents.map((a) => ({
      _id: a._id,
      name: a.name,
    }));
  },
});
