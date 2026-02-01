import { v } from "convex/values";

import { query } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return {
      id: identity.subject,
      email: identity.email ?? "",
      name: identity.name ?? null,
    };
  },
});

export const userExists = query({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email?.trim().toLowerCase();
    if (!normalizedEmail) {
      return false;
    }

    const userByEmail = await ctx.db
      .query("user")
      .filter((queryBuilder) =>
        queryBuilder.eq(queryBuilder.field("email"), normalizedEmail),
      )
      .first();

    return Boolean(userByEmail);
  },
});
