import { v } from "convex/values";

import { internalQuery, mutation, query } from "./_generated/server";
import { getOrCreatePlan } from "./plans";

export const create = mutation({
  args: {
    organizationId: v.string(),
    name: v.string(),
    description: v.optional(v.union(v.null(), v.string())),
    memoryRetention: v.string(),
    memoryTypes: v.array(v.string()),
    sessionLoggingEnabled: v.boolean(),
    memoryCurrentEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const trimmedName = args.name.trim();
    if (!trimmedName) {
      throw new Error("Project name is required.");
    }

    const plan = await getOrCreatePlan(ctx, args.organizationId);
    if (!plan) {
      throw new Error("Unable to retrieve plan information.");
    }
    
    const existingProjects = await ctx.db
      .query("projects")
      .withIndex("organizationId", (queryBuilder) =>
        queryBuilder.eq("organizationId", args.organizationId),
      )
      .collect();

    if (existingProjects.length >= plan.projectsLimit) {
      throw new Error("Project limit reached for this workspace.");
    }

    const projectId = await ctx.db.insert("projects", {
      name: trimmedName,
      description: args.description?.trim() || null,
      organizationId: args.organizationId,
      createdBy: identity.subject,
      createdAt: Date.now(),
      memoryRetention: args.memoryRetention,
      memoryTypes: args.memoryTypes,
      sessionLoggingEnabled: args.sessionLoggingEnabled,
      memoryCurrentEnabled: args.memoryCurrentEnabled,
    });

    return { id: projectId };
  },
});

export const listByOrganization = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("projects")
      .withIndex("organizationId", (queryBuilder) =>
        queryBuilder.eq("organizationId", args.organizationId),
      )
      .collect();
  },
});

export const getById = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});
