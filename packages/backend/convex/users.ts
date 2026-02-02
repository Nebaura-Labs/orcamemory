import { v } from "convex/values";
import { query, action, internalQuery, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

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

export const findByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("user")
      .withIndex("email_name", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!user) {
      return null;
    }

    // Get their organization memberships
    const memberships = await ctx.db
      .query("member")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    const organizations = await Promise.all(
      memberships.map(async (m) => {
        const org = await ctx.db
          .query("organization")
          .filter((q) => q.eq(q.field("_id"), m.organizationId))
          .first();
        return org ? { id: org._id, name: org.name, slug: org.slug, role: m.role } : null;
      })
    );

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      organizations: organizations.filter(Boolean),
    };
  },
});

export const findByEmail = action({
  args: { 
    email: v.string(),
    adminSecret: v.string(),
  },
  handler: async (ctx, { email, adminSecret }) => {
    const expectedSecret = process.env.ADMIN_SECRET;
    if (!expectedSecret || adminSecret !== expectedSecret) {
      throw new Error("Unauthorized: invalid admin secret");
    }

    return await ctx.runQuery(internal.users.findByEmailInternal, { email });
  },
});

export const findByEmailAction = httpAction(async (ctx, request) => {
  const adminSecret = process.env.ADMIN_SECRET;
  
  // Check authorization header
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace(/^Bearer\s+/i, "") ?? "";
  
  if (!adminSecret || providedSecret !== adminSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as { email?: string };
    const email = body.email;
    
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await ctx.runQuery(internal.users.findByEmailInternal, { email });
    
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
