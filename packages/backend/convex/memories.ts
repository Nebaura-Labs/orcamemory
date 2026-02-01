import { v } from "convex/values";

import { query, mutation } from "./_generated/server";

export const list = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    agentId: v.optional(v.id("agents")),
    memoryType: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const limit = Math.min(args.limit ?? 25, 100);
    const searchLower = args.search?.toLowerCase().trim() ?? "";

    let memoriesQuery = ctx.db
      .query("memories")
      .withIndex("projectId_createdAt", (q) => q.eq("projectId", args.projectId))
      .order("desc");

    const allMemories = await memoriesQuery.collect();

    // Filter in memory (Convex doesn't support complex filtering in queries)
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

    // Paginate
    const cursorIndex = args.cursor
      ? filtered.findIndex((m) => m._id === args.cursor)
      : -1;
    const startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    const page = filtered.slice(startIndex, startIndex + limit);
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

export const getById = query({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const memory = await ctx.db.get(args.memoryId);
    if (!memory) {
      return null;
    }

    const agent = await ctx.db.get(memory.agentId);

    return {
      ...memory,
      agentName: agent?.name ?? "Unknown",
    };
  },
});

export const deleteMemory = mutation({
  args: {
    memoryId: v.id("memories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const memory = await ctx.db.get(args.memoryId);
    if (!memory) {
      throw new Error("Memory not found");
    }

    await ctx.db.delete(args.memoryId);
    return { success: true };
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
