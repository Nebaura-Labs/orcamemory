import { query } from "./_generated/server";
import { v } from "convex/values";

// Get plan info for a workspace - organization data comes from Better Auth client
export const getWorkspacePlan = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const plan = await ctx.db
      .query("organizationPlans")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .first();

    if (!plan) {
      return { plan: "surface" as const };
    }

    return {
      plan: plan.plan as "surface" | "tide" | "abyss",
      tokensUsed: plan.tokensUsed,
      tokensLimit: plan.tokensLimit,
      searchesUsed: plan.searchesUsed,
      searchesLimit: plan.searchesLimit,
    };
  },
});
