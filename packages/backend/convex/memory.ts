import { v } from "convex/values";

import { httpAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { verifySecret } from "./agentAuth";
import { getOrCreatePlan, isEmbeddingsEnabled, type PlanId } from "./plans";

type AuthResult = {
  agentId: string;
  projectId: string;
  organizationId: string;
};

const embeddingUrl = process.env.EMBEDDING_URL;
const vectorScanLimit = Number(process.env.MEMORY_VECTOR_SCAN_LIMIT ?? "2000");

const fetchEmbedding = async (input: string, inputType: "query" | "passage") => {
  if (!embeddingUrl) {
    return null;
  }

  const base = embeddingUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/embed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input,
      input_type: inputType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding service error (${response.status})`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[]; tokens?: number }>;
    usage?: { total_tokens?: number };
  };

  const vector = payload.data?.[0]?.embedding;
  const tokens = payload.data?.[0]?.tokens ?? payload.usage?.total_tokens ?? 0;
  if (!vector || vector.length === 0) {
    return null;
  }
  return { vector, tokens };
};

const cosineSimilarity = (a: number[], b: number[]) => {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (!denom) {
    return 0;
  }
  return dot / denom;
};

export const logUsage = internalMutation({
  args: {
    organizationId: v.string(),
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    kind: v.string(),
    tokens: v.number(),
    searches: v.number(),
    memoryId: v.optional(v.id("memories")),
    query: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("usageLogs", {
      organizationId: args.organizationId,
      projectId: args.projectId,
      agentId: args.agentId,
      kind: args.kind,
      tokens: args.tokens,
      searches: args.searches,
      createdAt: Date.now(),
      memoryId: args.memoryId ?? undefined,
      query: args.query ?? undefined,
      metadata: args.metadata ?? undefined,
    });
    return { ok: true };
  },
});

const RETENTION_WINDOWS: Record<string, number | null> = {
  "Keep Forever": null,
  "One Year": 365,
  "Six Months": 180,
  "90 Days": 90,
  "30 Days": 30,
};

const resolveRetentionCutoff = (memoryRetention: string) => {
  const days = RETENTION_WINDOWS[memoryRetention];
  if (!days) {
    return null;
  }
  return Date.now() - days * 24 * 60 * 60 * 1000;
};

const resolveRetentionDays = (memoryRetention: string) => {
  const days = RETENTION_WINDOWS[memoryRetention];
  return typeof days === "number" ? days : null;
};

const getAuthFromRequest = async (ctx: any, request: Request): Promise<AuthResult | null> => {
  const headerKeyId = request.headers.get("x-orca-key-id") ?? "";
  const headerAuth = request.headers.get("authorization") ?? "";
  const bearerToken = headerAuth.startsWith("Bearer ") ? headerAuth.slice(7) : "";

  let bodyKeyId = "";
  let bodySecret = "";

  if (!headerKeyId || !bearerToken) {
    try {
      const body = (await request.clone().json()) as {
        keyId?: string;
        secret?: string;
      };
      bodyKeyId = body.keyId ?? "";
      bodySecret = body.secret ?? "";
    } catch {
      bodyKeyId = "";
      bodySecret = "";
    }
  }

  const keyId = headerKeyId || bodyKeyId;
  const secret = bearerToken || bodySecret;

  if (!keyId || !secret) {
    return null;
  }

  const keyRecord = await ctx.runQuery(internal.agents.getKeyRecord, { keyId });
  if (!keyRecord || keyRecord.revokedAt) {
    return null;
  }

  const matches = await verifySecret(secret, keyRecord.secretHash);
  if (!matches) {
    return null;
  }

  const agent = await ctx.runQuery(internal.agents.getAgentById, {
    agentId: keyRecord.agentId,
  });
  if (!agent) {
    return null;
  }

  return {
    agentId: agent._id,
    projectId: agent.projectId,
    organizationId: agent.organizationId,
  };
};

const markAgentActive = async (ctx: any, agentId: string) => {
  await ctx.runMutation(internal.agents.updateAgentStatus, {
    agentId: agentId as any,
  });
};

const normalizeTags = (value?: string[] | null) =>
  Array.isArray(value)
    ? value.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
    : [];

const matchesRetention = (createdAt: number, cutoff: number | null) =>
  cutoff === null ? true : createdAt >= cutoff;

const ensureSession = async (
  ctx: any,
  args: {
    sessionId?: string;
    name?: string;
    model?: string;
    agentId: string;
    projectId: string;
    organizationId: string;
  },
) => {
  const now = Date.now();
  if (args.sessionId) {
    const existing = await ctx.db.get(args.sessionId as any);
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastActivityAt: now,
        model: args.model ?? existing.model,
      });
      return existing._id;
    }
  }

  if (!args.name) {
    return null;
  }

  return await ctx.db.insert("sessions", {
    organizationId: args.organizationId,
    projectId: args.projectId as any,
    agentId: args.agentId as any,
    name: args.name,
    model: args.model ?? undefined,
    startedAt: now,
    lastActivityAt: now,
  });
};

export const storeMemory = internalMutation({
  args: {
    agentId: v.id("agents"),
    projectId: v.id("projects"),
    organizationId: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    memoryType: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    sessionName: v.optional(v.string()),
    model: v.optional(v.string()),
    eventKind: v.optional(v.string()),
    eventContent: v.optional(v.string()),
    tokensPrompt: v.optional(v.number()),
    tokensCompletion: v.optional(v.number()),
    tokensTotal: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tags = normalizeTags(args.tags ?? []);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    if (project.memoryTypes.length > 0) {
      if (!args.memoryType) {
        throw new Error("Memory type is required.");
      }
      if (!project.memoryTypes.includes(args.memoryType)) {
        throw new Error("Memory type is not enabled for this project.");
      }
    }

    const plan = await getOrCreatePlan(ctx, args.organizationId);
    if (!plan) {
      throw new Error("Plan not found.");
    }

    const tokensTotal =
      args.tokensTotal ??
      (args.tokensPrompt ?? 0) + (args.tokensCompletion ?? 0);

    const sessionId = project.sessionLoggingEnabled
      ? await ensureSession(ctx, {
          sessionId: args.sessionId ?? undefined,
          name: args.sessionName ?? undefined,
          model: args.model ?? undefined,
          agentId: args.agentId,
          projectId: args.projectId,
          organizationId: args.organizationId,
        })
      : null;

    if (project.sessionLoggingEnabled && sessionId) {
      await ctx.db.insert("sessionEvents", {
        organizationId: args.organizationId,
        projectId: args.projectId,
        agentId: args.agentId,
        sessionId,
        kind: args.eventKind ?? "memory_store",
        model: args.model ?? undefined,
        content: args.eventContent ?? args.content ?? undefined,
        tokensPrompt: args.tokensPrompt ?? undefined,
        tokensCompletion: args.tokensCompletion ?? undefined,
        tokensTotal: tokensTotal ?? undefined,
        createdAt: now,
      });
    }

    const memoryId = await ctx.db.insert("memories", {
      organizationId: args.organizationId,
      projectId: args.projectId,
      agentId: args.agentId,
      content: args.content,
      tags,
      metadata: args.metadata ?? undefined,
      memoryType: args.memoryType ?? undefined,
      sessionId: sessionId ?? undefined,
      embedding: args.embedding ?? undefined,
      createdAt: now,
    });

    return { id: memoryId, sessionId };
  },
});

export const searchMemories = internalQuery({
  args: {
    agentId: v.id("agents"),
    projectId: v.id("projects"),
    query: v.string(),
    limit: v.optional(v.number()),
    memoryType: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    queryEmbedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    const queryLower = args.query.trim().toLowerCase();
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const cutoff = resolveRetentionCutoff(project.memoryRetention);
    const tags = normalizeTags(args.tags ?? []);
    const queryEmbedding = args.queryEmbedding ?? undefined;
    const hasEmbeddingQuery = Array.isArray(queryEmbedding) && queryEmbedding.length > 0;

    const scanLimit = Number.isFinite(vectorScanLimit)
      ? Math.max(100, Math.min(vectorScanLimit, 20_000))
      : 2000;

    const memories = await ctx.db
      .query("memories")
      .withIndex("projectId_createdAt", (queryBuilder) => {
        const scoped = queryBuilder.eq("projectId", args.projectId);
        if (cutoff) {
          return scoped.gt("createdAt", cutoff);
        }
        return scoped;
      })
      .order("desc")
      .take(scanLimit);

    const filtered = memories.filter((memory) => {
      if (!matchesRetention(memory.createdAt, cutoff)) {
        return false;
      }
      if (args.memoryType && memory.memoryType !== args.memoryType) {
        return false;
      }
      if (tags.length > 0 && tags.every((tag) => !memory.tags.includes(tag))) {
        return false;
      }
      if (!hasEmbeddingQuery) {
        return memory.content.toLowerCase().includes(queryLower);
      }
      return true;
    });

    const scored = filtered.map((memory) => {
      const matchesText = memory.content.toLowerCase().includes(queryLower);
      let score = matchesText ? 0.05 : 0;
      if (hasEmbeddingQuery && memory.embedding && memory.embedding.length > 0) {
        score = cosineSimilarity(queryEmbedding as number[], memory.embedding);
      }
      return { memory, score };
    });

    const sorted = hasEmbeddingQuery
      ? scored.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.memory.createdAt - a.memory.createdAt;
        })
      : scored.sort((a, b) => b.memory.createdAt - a.memory.createdAt);

    return sorted.slice(0, limit).map(({ memory }) => ({
      id: memory._id,
      content: memory.content,
      tags: memory.tags,
      metadata: memory.metadata ?? null,
      memoryType: memory.memoryType ?? null,
      createdAt: memory.createdAt,
    }));
  },
});

export const forgetMemories = internalMutation({
  args: {
    agentId: v.id("agents"),
    projectId: v.id("projects"),
    ids: v.array(v.id("memories")),
  },
  handler: async (ctx, args) => {
    let deleted = 0;
    
    // Delete each memory directly instead of loading all memories
    for (const id of args.ids) {
      const memory = await ctx.db.get(id);
      if (memory && memory.projectId === args.projectId && memory.agentId === args.agentId) {
        await ctx.db.delete(id);
        deleted += 1;
      }
    }

    return { deleted };
  },
});

export const getProfile = internalQuery({
  args: {
    agentId: v.id("agents"),
    projectId: v.id("projects"),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found.");
    }

    const [memories, sessions] = await Promise.all([
      ctx.db
        .query("memories")
        .withIndex("projectId", (queryBuilder) =>
          queryBuilder.eq("projectId", args.projectId),
        )
        .collect(),
      ctx.db
        .query("sessions")
        .withIndex("projectId", (queryBuilder) =>
          queryBuilder.eq("projectId", args.projectId),
        )
        .collect(),
    ]);

    const cutoff = resolveRetentionCutoff(project.memoryRetention);
    const agentMemories = memories.filter(
      (memory) => memory.agentId === args.agentId && matchesRetention(memory.createdAt, cutoff),
    );
    const agentSessions = sessions.filter((session) => session.agentId === args.agentId);
    const currentMemories = project.memoryCurrentEnabled
      ? memories
          .filter((memory) => matchesRetention(memory.createdAt, cutoff))
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 20)
          .map((memory) => ({
            id: memory._id,
            content: memory.content,
            tags: memory.tags,
            memoryType: memory.memoryType ?? null,
            createdAt: memory.createdAt,
          }))
      : [];

    const plan = await ctx.db
      .query("organizationPlans")
      .withIndex("organizationId", (queryBuilder) =>
        queryBuilder.eq("organizationId", args.organizationId),
      )
      .first();

    return {
      memoryCount: agentMemories.length,
      sessionCount: agentSessions.length,
      lastSessionAt: agentSessions[0]?.lastActivityAt ?? null,
      current: currentMemories,
      usage: plan
        ? {
            tokensUsed: plan.tokensUsed,
            tokensLimit: plan.tokensLimit,
            searchesUsed: plan.searchesUsed,
            searchesLimit: plan.searchesLimit,
          }
        : null,
    };
  },
});

export const createSession = internalMutation({
  args: {
    agentId: v.id("agents"),
    projectId: v.id("projects"),
    organizationId: v.string(),
    name: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      organizationId: args.organizationId,
      projectId: args.projectId,
      agentId: args.agentId,
      name: args.name,
      model: args.model ?? undefined,
      startedAt: now,
      lastActivityAt: now,
    });
    return { sessionId };
  },
});

export const recordSessionEvent = internalMutation({
  args: {
    agentId: v.id("agents"),
    projectId: v.id("projects"),
    organizationId: v.string(),
    sessionId: v.id("sessions"),
    kind: v.string(),
    model: v.optional(v.string()),
    content: v.optional(v.string()),
    tokensPrompt: v.optional(v.number()),
    tokensCompletion: v.optional(v.number()),
    tokensTotal: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tokensTotal =
      args.tokensTotal ??
      (args.tokensPrompt ?? 0) + (args.tokensCompletion ?? 0);

    await ctx.db.patch(args.sessionId, {
      lastActivityAt: now,
      model: args.model ?? undefined,
    });

    await ctx.db.insert("sessionEvents", {
      organizationId: args.organizationId,
      projectId: args.projectId,
      agentId: args.agentId,
      sessionId: args.sessionId,
      kind: args.kind,
      model: args.model ?? undefined,
      content: args.content ?? undefined,
      tokensPrompt: args.tokensPrompt ?? undefined,
      tokensCompletion: args.tokensCompletion ?? undefined,
      tokensTotal: tokensTotal ?? undefined,
      createdAt: now,
    });

    return { ok: true };
  },
});

export const cleanupExpiredMemories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query("projects").collect();
    let deleted = 0;

    for (const project of projects) {
      const retentionDays = resolveRetentionDays(project.memoryRetention);
      if (!retentionDays) {
        continue;
      }
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

      const expired = await ctx.db
        .query("memories")
        .withIndex("projectId_createdAt", (queryBuilder) =>
          queryBuilder.eq("projectId", project._id).lt("createdAt", cutoff),
        )
        .take(200);

      for (const memory of expired) {
        await ctx.db.delete(memory._id);
        deleted += 1;
      }
    }

    return { deleted };
  },
});

export const storeMemoryAction = httpAction(async (ctx, request) => {
  const auth = await getAuthFromRequest(ctx, request);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  await markAgentActive(ctx, auth.agentId);

  const payload = (await request.json()) as {
    content?: string;
    tags?: string[];
    metadata?: unknown;
    memoryType?: string;
    sessionId?: string;
    sessionName?: string;
    model?: string;
    eventKind?: string;
    eventContent?: string;
    tokensPrompt?: number;
    tokensCompletion?: number;
    tokensTotal?: number;
  };

  if (!payload.content) {
    return new Response("Missing content", { status: 400 });
  }

  const plan = await ctx.runMutation(internal.plans.getOrCreatePlanInternal, {
    organizationId: auth.organizationId,
  });
  const embeddingsEnabled = isEmbeddingsEnabled(plan.plan as PlanId);

  let embedding: number[] | undefined;
  let embeddingTokens = 0;
  if (embeddingsEnabled && embeddingUrl) {
    try {
      const result = await fetchEmbedding(payload.content, "passage");
      embedding = result?.vector ?? undefined;
      embeddingTokens = result?.tokens ?? 0;
    } catch {
      embedding = undefined;
    }
  }

  await ctx.runMutation(internal.plans.recordUsage, {
    organizationId: auth.organizationId,
    tokens: embeddingTokens,
    searches: 0,
  });

  const result = await ctx.runMutation(internal.memory.storeMemory, {
    agentId: auth.agentId as any,
    projectId: auth.projectId as any,
    organizationId: auth.organizationId,
    content: payload.content,
    tags: payload.tags ?? [],
    metadata: payload.metadata ?? undefined,
    memoryType: payload.memoryType ?? undefined,
    sessionId: payload.sessionId ?? undefined,
    sessionName: payload.sessionName ?? undefined,
    model: payload.model ?? undefined,
    eventKind: payload.eventKind ?? undefined,
    eventContent: payload.eventContent ?? undefined,
    tokensPrompt: payload.tokensPrompt ?? undefined,
    tokensCompletion: payload.tokensCompletion ?? undefined,
    tokensTotal: payload.tokensTotal ?? undefined,
    embedding: embedding ?? undefined,
  });

  await ctx.runMutation(internal.memory.logUsage, {
    organizationId: auth.organizationId,
    projectId: auth.projectId as any,
    agentId: auth.agentId as any,
    kind: "embedding_store",
    tokens: embeddingTokens,
    searches: 0,
    memoryId: result.id as any,
    metadata: {
      model: payload.model ?? undefined,
      memoryType: payload.memoryType ?? undefined,
    },
  });

  return Response.json(result);
});

export const searchMemoriesAction = httpAction(async (ctx, request) => {
  const auth = await getAuthFromRequest(ctx, request);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  await markAgentActive(ctx, auth.agentId);

  const payload = (await request.json()) as {
    query?: string;
    limit?: number;
    tokensTotal?: number;
    memoryType?: string;
    tags?: string[];
  };
  if (!payload.query) {
    return new Response("Missing query", { status: 400 });
  }

  const plan = await ctx.runMutation(internal.plans.getOrCreatePlanInternal, {
    organizationId: auth.organizationId,
  });
  const embeddingsEnabled = isEmbeddingsEnabled(plan.plan as PlanId);

  let queryEmbedding: number[] | undefined;
  let embeddingTokens = 0;
  if (embeddingsEnabled && embeddingUrl) {
    try {
      const result = await fetchEmbedding(payload.query, "query");
      queryEmbedding = result?.vector ?? undefined;
      embeddingTokens = result?.tokens ?? 0;
    } catch {
      queryEmbedding = undefined;
    }
  }

  await ctx.runMutation(internal.plans.recordUsage, {
    organizationId: auth.organizationId,
    tokens: embeddingTokens,
    searches: 1,
  });

  const results = await ctx.runQuery(internal.memory.searchMemories, {
    agentId: auth.agentId as any,
    projectId: auth.projectId as any,
    query: payload.query,
    limit: payload.limit ?? undefined,
    memoryType: payload.memoryType ?? undefined,
    tags: payload.tags ?? undefined,
    queryEmbedding: queryEmbedding ?? undefined,
  });

  await ctx.runMutation(internal.memory.logUsage, {
    organizationId: auth.organizationId,
    projectId: auth.projectId as any,
    agentId: auth.agentId as any,
    kind: "embedding_search",
    tokens: embeddingTokens,
    searches: 1,
    query: payload.query,
  });

  return Response.json({ results });
});

export const forgetMemoriesAction = httpAction(async (ctx, request) => {
  const auth = await getAuthFromRequest(ctx, request);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  await markAgentActive(ctx, auth.agentId);

  const payload = (await request.json()) as { ids?: string[] };
  if (!payload.ids || payload.ids.length === 0) {
    return new Response("Missing ids", { status: 400 });
  }

  const ids = payload.ids.map((id) => id as any);
  const result = await ctx.runMutation(internal.memory.forgetMemories, {
    agentId: auth.agentId as any,
    projectId: auth.projectId as any,
    ids,
  });

  return Response.json(result);
});

export const profileAction = httpAction(async (ctx, request) => {
  const auth = await getAuthFromRequest(ctx, request);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  await markAgentActive(ctx, auth.agentId);

  const result = await ctx.runQuery(internal.memory.getProfile, {
    agentId: auth.agentId as any,
    projectId: auth.projectId as any,
    organizationId: auth.organizationId,
  });

  return Response.json(result);
});

export const startSessionAction = httpAction(async (ctx, request) => {
  const auth = await getAuthFromRequest(ctx, request);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  await markAgentActive(ctx, auth.agentId);

  const project = await ctx.runQuery(internal.projects.getById, {
    projectId: auth.projectId as any,
  });
  if (!project || !project.sessionLoggingEnabled) {
    return new Response("Session logging disabled", { status: 400 });
  }

  const payload = (await request.json()) as { name?: string; model?: string };
  if (!payload.name) {
    return new Response("Missing name", { status: 400 });
  }

  const result = await ctx.runMutation(internal.memory.createSession, {
    agentId: auth.agentId as any,
    projectId: auth.projectId as any,
    organizationId: auth.organizationId,
    name: payload.name,
    model: payload.model ?? undefined,
  });

  return Response.json(result);
});

export const recordSessionAction = httpAction(async (ctx, request) => {
  const auth = await getAuthFromRequest(ctx, request);
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  await markAgentActive(ctx, auth.agentId);

  const project = await ctx.runQuery(internal.projects.getById, {
    projectId: auth.projectId as any,
  });
  if (!project || !project.sessionLoggingEnabled) {
    return new Response("Session logging disabled", { status: 400 });
  }

  const payload = (await request.json()) as {
    sessionId?: string;
    kind?: string;
    model?: string;
    content?: string;
    tokensPrompt?: number;
    tokensCompletion?: number;
    tokensTotal?: number;
  };
  if (!payload.sessionId || !payload.kind) {
    return new Response("Missing sessionId or kind", { status: 400 });
  }

  const result = await ctx.runMutation(internal.memory.recordSessionEvent, {
    agentId: auth.agentId as any,
    projectId: auth.projectId as any,
    organizationId: auth.organizationId,
    sessionId: payload.sessionId as any,
    kind: payload.kind,
    model: payload.model ?? undefined,
    content: payload.content ?? undefined,
    tokensPrompt: payload.tokensPrompt ?? undefined,
    tokensCompletion: payload.tokensCompletion ?? undefined,
    tokensTotal: payload.tokensTotal ?? undefined,
  });

  return Response.json(result);
});
