import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    organizationId: v.string(),
    projectId: v.id("projects"),
    name: v.string(),
    status: v.union(v.literal("pending"), v.literal("connected")),
    createdBy: v.string(),
    createdAt: v.number(),
    lastSeenAt: v.optional(v.number()),
  })
    .index("projectId", ["projectId"])
    .index("organizationId", ["organizationId"])
    .index("createdBy", ["createdBy"]),
  agentKeys: defineTable({
    agentId: v.id("agents"),
    keyId: v.string(),
    secretHash: v.string(),
    secret: v.optional(v.string()),
    createdAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("agentId", ["agentId"])
    .index("keyId", ["keyId"]),
  organizationPlans: defineTable({
    organizationId: v.string(),
    plan: v.string(),
    projectsLimit: v.number(),
    agentsPerProjectLimit: v.number(),
    tokensLimit: v.number(),
    searchesLimit: v.number(),
    tokensUsed: v.number(),
    searchesUsed: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("organizationId", ["organizationId"]),
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.union(v.null(), v.string())),
    organizationId: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    memoryRetention: v.string(),
    memoryTypes: v.array(v.string()),
    sessionLoggingEnabled: v.boolean(),
    memoryCurrentEnabled: v.boolean(),
  })
    .index("organizationId", ["organizationId"])
    .index("createdBy", ["createdBy"]),
  memories: defineTable({
    organizationId: v.string(),
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    content: v.string(),
    tags: v.array(v.string()),
    metadata: v.optional(v.any()),
    memoryType: v.optional(v.string()),
    sessionId: v.optional(v.id("sessions")),
    embedding: v.optional(v.array(v.number())),
    createdAt: v.number(),
  })
    .index("projectId", ["projectId"])
    .index("agentId", ["agentId"])
    .index("organizationId", ["organizationId"])
    .index("projectId_createdAt", ["projectId", "createdAt"])
    .index("projectId_memoryType_createdAt", [
      "projectId",
      "memoryType",
      "createdAt",
    ]),
  sessions: defineTable({
    organizationId: v.string(),
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    name: v.string(),
    model: v.optional(v.string()),
    startedAt: v.number(),
    lastActivityAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("projectId", ["projectId"])
    .index("agentId", ["agentId"])
    .index("organizationId", ["organizationId"])
    .index("agentId_name", ["agentId", "name"]),
  sessionEvents: defineTable({
    organizationId: v.string(),
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    sessionId: v.id("sessions"),
    kind: v.string(),
    model: v.optional(v.string()),
    content: v.optional(v.string()),
    tokensPrompt: v.optional(v.number()),
    tokensCompletion: v.optional(v.number()),
    tokensTotal: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("sessionId", ["sessionId"])
    .index("agentId", ["agentId"])
    .index("projectId", ["projectId"]),
  usageLogs: defineTable({
    organizationId: v.string(),
    projectId: v.id("projects"),
    agentId: v.id("agents"),
    kind: v.string(),
    tokens: v.number(),
    searches: v.number(),
    createdAt: v.number(),
    memoryId: v.optional(v.id("memories")),
    query: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("organizationId", ["organizationId"])
    .index("projectId", ["projectId"])
    .index("agentId", ["agentId"])
    .index("kind", ["kind"]),
});
