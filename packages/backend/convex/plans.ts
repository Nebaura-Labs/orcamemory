import { v } from "convex/values";

import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";

export type PlanId = "surface" | "tide" | "abyss";

export interface PlanLimits {
	plan: PlanId;
	projectsLimit: number;
	agentsPerProjectLimit: number;
	tokensLimit: number;
	searchesLimit: number;
	embeddingsEnabled: boolean;
	memoryRetentionMaxDays: number | null; // null means unlimited
}

const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
	surface: {
		plan: "surface",
		projectsLimit: 1,
		agentsPerProjectLimit: 1,
		tokensLimit: 500_000,
		searchesLimit: 5000,
		embeddingsEnabled: true,
		memoryRetentionMaxDays: 30, // Free: 30 days max
	},
	tide: {
		plan: "tide",
		projectsLimit: 10,
		agentsPerProjectLimit: 5,
		tokensLimit: 5_000_000,
		searchesLimit: 200_000,
		embeddingsEnabled: true,
		memoryRetentionMaxDays: 180, // 6 months
	},
	abyss: {
		plan: "abyss",
		projectsLimit: 50,
		agentsPerProjectLimit: 20,
		tokensLimit: 25_000_000,
		searchesLimit: 2_000_000,
		embeddingsEnabled: true,
		memoryRetentionMaxDays: null, // Unlimited
	},
};

const getDefaultPlan = () => PLAN_LIMITS.surface;

export const isEmbeddingsEnabled = (plan: PlanId) =>
	PLAN_LIMITS[plan]?.embeddingsEnabled ?? false;

export const getPlanConfig = (plan: PlanId) =>
	PLAN_LIMITS[plan] ?? getDefaultPlan();

export const getMemoryRetentionMaxDays = (plan: PlanId) =>
	PLAN_LIMITS[plan]?.memoryRetentionMaxDays ?? 30;

// Retention options with their day values
const RETENTION_OPTIONS: Record<string, number | null> = {
	"Keep Forever": null,
	"One Year": 365,
	"Six Months": 180,
	"90 Days": 90,
	"30 Days": 30,
};

// Get allowed retention options for a plan
export const getAllowedRetentionOptions = (plan: PlanId) => {
	const maxDays = getMemoryRetentionMaxDays(plan);

	// If unlimited, return all options
	if (maxDays === null) {
		return Object.keys(RETENTION_OPTIONS);
	}

	// Filter options that are within the plan's limit
	return Object.entries(RETENTION_OPTIONS)
		.filter(([_, days]) => days !== null && days <= maxDays)
		.map(([label]) => label);
};

export const getRetentionLimits = query({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const planDoc = await ctx.db
			.query("organizationPlans")
			.withIndex("organizationId", (queryBuilder) =>
				queryBuilder.eq("organizationId", args.organizationId)
			)
			.first();

		const planId = (planDoc?.plan as PlanId) ?? "surface";
		const maxDays = getMemoryRetentionMaxDays(planId);
		const allowedOptions = getAllowedRetentionOptions(planId);

		return {
			plan: planId,
			maxDays,
			allowedOptions,
		};
	},
});

export const getForOrganization = query({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		return await ctx.db
			.query("organizationPlans")
			.withIndex("organizationId", (queryBuilder) =>
				queryBuilder.eq("organizationId", args.organizationId)
			)
			.first();
	},
});

export const setForOrganization = mutation({
	args: {
		organizationId: v.string(),
		plan: v.union(v.literal("surface"), v.literal("tide"), v.literal("abyss")),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const limits = PLAN_LIMITS[args.plan];
		const existing = await ctx.db
			.query("organizationPlans")
			.withIndex("organizationId", (queryBuilder) =>
				queryBuilder.eq("organizationId", args.organizationId)
			)
			.first();

		const payload = {
			organizationId: args.organizationId,
			plan: limits.plan,
			projectsLimit: limits.projectsLimit,
			agentsPerProjectLimit: limits.agentsPerProjectLimit,
			tokensLimit: limits.tokensLimit,
			searchesLimit: limits.searchesLimit,
			tokensUsed: existing?.tokensUsed ?? 0,
			searchesUsed: existing?.searchesUsed ?? 0,
			createdAt: existing?.createdAt ?? Date.now(),
			updatedAt: Date.now(),
		};

		if (existing) {
			await ctx.db.patch(existing._id, payload);
			return { id: existing._id };
		}

		const id = await ctx.db.insert("organizationPlans", payload);
		return { id };
	},
});

export const ensurePlanForOrganization = mutation({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Unauthorized");
		}

		const existing = await ctx.db
			.query("organizationPlans")
			.withIndex("organizationId", (queryBuilder) =>
				queryBuilder.eq("organizationId", args.organizationId)
			)
			.first();

		if (existing) {
			return existing;
		}

		const defaults = getDefaultPlan();
		const id = await ctx.db.insert("organizationPlans", {
			organizationId: args.organizationId,
			plan: defaults.plan,
			projectsLimit: defaults.projectsLimit,
			agentsPerProjectLimit: defaults.agentsPerProjectLimit,
			tokensLimit: defaults.tokensLimit,
			searchesLimit: defaults.searchesLimit,
			tokensUsed: 0,
			searchesUsed: 0,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return await ctx.db.get(id);
	},
});

export const getOrCreatePlanInternal = internalMutation({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		return await getOrCreatePlan(ctx, args.organizationId);
	},
});

export const recordUsage = internalMutation({
	args: {
		organizationId: v.string(),
		tokens: v.number(),
		searches: v.number(),
	},
	handler: async (ctx, args) => {
		const planDoc = await getOrCreatePlan(ctx, args.organizationId);
		const nextTokens = planDoc.tokensUsed + args.tokens;
		const nextSearches = planDoc.searchesUsed + args.searches;

		if (nextTokens > planDoc.tokensLimit) {
			throw new Error("Token limit exceeded.");
		}
		if (nextSearches > planDoc.searchesLimit) {
			throw new Error("Search limit exceeded.");
		}

		await ctx.db.patch(planDoc._id, {
			tokensUsed: nextTokens,
			searchesUsed: nextSearches,
			updatedAt: Date.now(),
		});

		return {
			tokensUsed: nextTokens,
			searchesUsed: nextSearches,
			tokensLimit: planDoc.tokensLimit,
			searchesLimit: planDoc.searchesLimit,
			plan: planDoc.plan as PlanId,
		};
	},
});

export const getUsage = query({
	args: {
		organizationId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			return null;
		}

		const planDoc = await ctx.db
			.query("organizationPlans")
			.withIndex("organizationId", (queryBuilder) =>
				queryBuilder.eq("organizationId", args.organizationId)
			)
			.first();

		if (!planDoc) {
			return null;
		}

		return {
			plan: planDoc.plan as PlanId,
			tokensUsed: planDoc.tokensUsed,
			searchesUsed: planDoc.searchesUsed,
			tokensLimit: planDoc.tokensLimit,
			searchesLimit: planDoc.searchesLimit,
		};
	},
});

export const getAgentLimits = query({
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

		const planDoc = await ctx.db
			.query("organizationPlans")
			.withIndex("organizationId", (queryBuilder) =>
				queryBuilder.eq("organizationId", project.organizationId)
			)
			.first();

		const limit = planDoc?.agentsPerProjectLimit ?? 1;
		const plan = (planDoc?.plan as PlanId) ?? "surface";

		const agents = await ctx.db
			.query("agents")
			.withIndex("projectId", (queryBuilder) =>
				queryBuilder.eq("projectId", args.projectId)
			)
			.collect();

		return {
			current: agents.length,
			limit,
			plan,
			canCreate: agents.length < limit,
		};
	},
});

const getPlanDoc = async (db: QueryCtx["db"], organizationId: string) => {
	return await db
		.query("organizationPlans")
		.withIndex("organizationId", (queryBuilder) =>
			queryBuilder.eq("organizationId", organizationId)
		)
		.first();
};

export const resolvePlanLimits = async (
	db: QueryCtx["db"],
	organizationId: string
) => {
	const planDoc = await getPlanDoc(db, organizationId);

	if (planDoc) {
		const planId = planDoc.plan as PlanId;
		const planConfig = getPlanConfig(planId);
		return {
			plan: planId,
			projectsLimit: planDoc.projectsLimit,
			agentsPerProjectLimit: planDoc.agentsPerProjectLimit,
			tokensLimit: planDoc.tokensLimit,
			searchesLimit: planDoc.searchesLimit,
			embeddingsEnabled: isEmbeddingsEnabled(planId),
			memoryRetentionMaxDays: planConfig.memoryRetentionMaxDays,
		} satisfies PlanLimits;
	}

	return getDefaultPlan();
};

export const getOrCreatePlan = async (
	ctx: MutationCtx,
	organizationId: string
) => {
	const existing = await getPlanDoc(ctx.db, organizationId);
	if (existing) {
		return existing;
	}

	const defaults = getDefaultPlan();
	const id = await ctx.db.insert("organizationPlans", {
		organizationId,
		plan: defaults.plan,
		projectsLimit: defaults.projectsLimit,
		agentsPerProjectLimit: defaults.agentsPerProjectLimit,
		tokensLimit: defaults.tokensLimit,
		searchesLimit: defaults.searchesLimit,
		tokensUsed: 0,
		searchesUsed: 0,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});

	const plan = await ctx.db.get(id);
	if (!plan) {
		throw new Error("Failed to create plan.");
	}
	return plan;
};
