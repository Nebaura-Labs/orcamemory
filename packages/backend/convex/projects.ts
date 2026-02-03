import { v } from "convex/values";

import { internalQuery, mutation, query } from "./_generated/server";
import {
	getAllowedRetentionOptions,
	getOrCreatePlan,
	type PlanId,
} from "./plans";

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

		// Validate retention option against plan limits
		const planId = plan.plan as PlanId;
		const allowedOptions = getAllowedRetentionOptions(planId);
		if (!allowedOptions.includes(args.memoryRetention)) {
			throw new Error(
				`Memory retention "${args.memoryRetention}" is not available on your current plan. ` +
					`Allowed options: ${allowedOptions.join(", ")}.`
			);
		}

		const existingProjects = await ctx.db
			.query("projects")
			.withIndex("organizationId", (queryBuilder) =>
				queryBuilder.eq("organizationId", args.organizationId)
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
			return [];
		}

		return await ctx.db
			.query("projects")
			.withIndex("organizationId", (queryBuilder) =>
				queryBuilder.eq("organizationId", args.organizationId)
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

export const get = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const project = await ctx.db.get(args.projectId);
		if (!project || project.createdBy !== identity.subject) {
			return null;
		}

		return project;
	},
});

export const update = mutation({
	args: {
		projectId: v.id("projects"),
		name: v.optional(v.string()),
		description: v.optional(v.union(v.null(), v.string())),
		memoryRetention: v.optional(v.string()),
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

		const updates: Partial<{
			name: string;
			description: string | null;
			memoryRetention: string;
		}> = {};

		if (args.name !== undefined) {
			const trimmedName = args.name.trim();
			if (!trimmedName) {
				throw new Error("Project name cannot be empty.");
			}
			updates.name = trimmedName;
		}

		if (args.description !== undefined) {
			updates.description = args.description?.trim() || null;
		}

		if (args.memoryRetention !== undefined) {
			// Validate retention option against plan limits
			const plan = await getOrCreatePlan(ctx, project.organizationId);
			const planId = plan.plan as PlanId;
			const allowedOptions = getAllowedRetentionOptions(planId);
			if (!allowedOptions.includes(args.memoryRetention)) {
				throw new Error(
					`Memory retention "${args.memoryRetention}" is not available on your current plan. ` +
						`Allowed options: ${allowedOptions.join(", ")}.`
				);
			}
			updates.memoryRetention = args.memoryRetention;
		}

		if (Object.keys(updates).length === 0) {
			return { success: true };
		}

		await ctx.db.patch(args.projectId, updates);
		return { success: true };
	},
});

export const remove = mutation({
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

		// Delete all agents for this project
		const agents = await ctx.db
			.query("agents")
			.withIndex("projectId", (q) => q.eq("projectId", args.projectId))
			.collect();

		for (const agent of agents) {
			await ctx.db.delete(agent._id);
		}

		// Delete all memories for this project
		const memories = await ctx.db
			.query("memories")
			.withIndex("projectId", (q) => q.eq("projectId", args.projectId))
			.collect();

		for (const memory of memories) {
			await ctx.db.delete(memory._id);
		}

		// Delete all sessions for this project
		const sessions = await ctx.db
			.query("sessions")
			.withIndex("projectId", (q) => q.eq("projectId", args.projectId))
			.collect();

		for (const session of sessions) {
			// Delete session events
			const events = await ctx.db
				.query("sessionEvents")
				.withIndex("sessionId", (q) => q.eq("sessionId", session._id))
				.collect();

			for (const event of events) {
				await ctx.db.delete(event._id);
			}

			await ctx.db.delete(session._id);
		}

		// Delete usage logs for this project
		const usageLogs = await ctx.db
			.query("usageLogs")
			.withIndex("projectId", (q) => q.eq("projectId", args.projectId))
			.collect();

		for (const log of usageLogs) {
			await ctx.db.delete(log._id);
		}

		// Finally delete the project
		await ctx.db.delete(args.projectId);

		return { success: true };
	},
});
