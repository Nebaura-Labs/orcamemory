import { v } from "convex/values";

import { httpAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getOrCreatePlan } from "./plans";
import { hashSecret, verifySecret } from "./agentAuth";

const createKeyId = () => {
  const raw = crypto.randomUUID().replaceAll("-", "");
  return `omk_${raw.slice(0, 20)}`;
};

const createSecret = () => {
  const raw = crypto.randomUUID().replaceAll("-", "");
  const extra = crypto.randomUUID().replaceAll("-", "");
  return `oms_${raw}${extra}`;
};

type AuthPayload = {
  keyId: string;
  secret: string;
};

const parseAuthPayload = async (
  request: Request,
): Promise<{ payload: AuthPayload } | { response: Response }> => {
  if (request.method !== "POST") {
    return { response: new Response("Method not allowed", { status: 405 }) };
  }

  let payload: { keyId?: string; secret?: string } = {};
  try {
    payload = (await request.json()) as { keyId?: string; secret?: string };
  } catch {
    return { response: new Response("Invalid JSON", { status: 400 }) };
  }

  if (!payload.keyId || !payload.secret) {
    return { response: new Response("Missing keyId or secret", { status: 400 }) };
  }

  return { payload: { keyId: payload.keyId, secret: payload.secret } };
};

export const issueKey = mutation({
  args: {
    projectId: v.id("projects"),
    rotate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.createdBy !== identity.subject) {
      throw new Error("Project not found.");
    }

    const plan = await getOrCreatePlan(ctx, project.organizationId);
    if (!plan) {
      throw new Error("Unable to retrieve plan information.");
    }
    
    const existingAgents = await ctx.db
      .query("agents")
      .withIndex("projectId", (queryBuilder) =>
        queryBuilder.eq("projectId", args.projectId),
      )
      .collect();

    let agentId = existingAgents[0]?._id ?? null;
    if (!agentId) {
      if (existingAgents.length >= plan.agentsPerProjectLimit) {
        throw new Error("Agent limit reached for this project.");
      }

      agentId = await ctx.db.insert("agents", {
        organizationId: project.organizationId,
        projectId: args.projectId,
        name: "OpenClaw Agent",
        status: "pending",
        createdBy: identity.subject,
        createdAt: Date.now(),
      });
    }

    const activeKey = await ctx.db
      .query("agentKeys")
      .withIndex("agentId", (queryBuilder) => queryBuilder.eq("agentId", agentId))
      .filter((queryBuilder) => queryBuilder.eq(queryBuilder.field("revokedAt"), undefined))
      .first();

    if (!args.rotate && activeKey) {
      return { agentId, keyId: activeKey.keyId, secret: null };
    }

    const keyId = createKeyId();
    const secret = createSecret();
    const secretHash = await hashSecret(secret);

    if (args.rotate || activeKey) {
      const existingKeys = await ctx.db
        .query("agentKeys")
        .withIndex("agentId", (queryBuilder) => queryBuilder.eq("agentId", agentId))
        .collect();
      for (const key of existingKeys) {
        if (!key.revokedAt) {
          await ctx.db.patch(key._id, { revokedAt: Date.now() });
        }
      }
    }

    await ctx.db.insert("agentKeys", {
      agentId,
      keyId,
      secretHash,
      createdAt: Date.now(),
    });

    return { agentId, keyId, secret };
  },
});

export const clearPlaintextSecrets = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const keys = await ctx.db.query("agentKeys").collect();
    let cleared = 0;
    for (const key of keys) {
      if (key.secret) {
        await ctx.db.patch(key._id, { secret: undefined });
        cleared += 1;
      }
    }

    return { cleared };
  },
});

export const getActiveKeyByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.createdBy !== identity.subject) {
      throw new Error("Project not found.");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("projectId", (queryBuilder) => queryBuilder.eq("projectId", args.projectId))
      .first();

    if (!agent) {
      return null;
    }

    const key = await ctx.db
      .query("agentKeys")
      .withIndex("agentId", (queryBuilder) => queryBuilder.eq("agentId", agent._id))
      .filter((queryBuilder) => queryBuilder.eq(queryBuilder.field("revokedAt"), undefined))
      .first();

    if (!key) {
      return null;
    }

    return { keyId: key.keyId };
  },
});

export const getStatusByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.createdBy !== identity.subject) {
      throw new Error("Project not found.");
    }

    const agent = await ctx.db
      .query("agents")
      .withIndex("projectId", (queryBuilder) => queryBuilder.eq("projectId", args.projectId))
      .first();

    return {
      connected: agent?.status === "connected",
      lastSeenAt: agent?.lastSeenAt ?? null,
    };
  },
});

export const connect = httpAction(async (ctx, request) => {
  const parsed = await parseAuthPayload(request);
  if ("response" in parsed) {
    return parsed.response;
  }

  const payload = parsed.payload;

  const keyRecord = await ctx.runQuery(internal.agents.getKeyRecord, {
    keyId: payload.keyId,
  });

  if (!keyRecord || keyRecord.revokedAt) {
    return new Response("Invalid key", { status: 401 });
  }

  const matches = await verifySecret(payload.secret, keyRecord.secretHash);
  if (!matches) {
    return new Response("Invalid key", { status: 401 });
  }

  await ctx.runMutation(internal.agents.updateAgentStatus, {
    agentId: keyRecord.agentId,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

export const health = httpAction(async (ctx, request) => {
  const parsed = await parseAuthPayload(request);
  if ("response" in parsed) {
    return parsed.response;
  }

  const payload = parsed.payload;

  const keyRecord = await ctx.runQuery(internal.agents.getKeyRecord, {
    keyId: payload.keyId,
  });

  if (!keyRecord || keyRecord.revokedAt) {
    return new Response("Invalid key", { status: 401 });
  }

  const matches = await verifySecret(payload.secret, keyRecord.secretHash);
  if (!matches) {
    return new Response("Invalid key", { status: 401 });
  }

  await ctx.runMutation(internal.agents.updateAgentStatus, {
    agentId: keyRecord.agentId,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

export const getKeyRecord = internalQuery({
  args: {
    keyId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentKeys")
      .withIndex("keyId", (queryBuilder) => queryBuilder.eq("keyId", args.keyId))
      .first();
  },
});

export const getAgentById = internalQuery({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.agentId);
  },
});

export const updateAgentStatus = internalMutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      status: "connected",
      lastSeenAt: Date.now(),
    });
  },
});
