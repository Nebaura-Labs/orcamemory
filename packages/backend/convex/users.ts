import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { action, httpAction, internalQuery, query } from "./_generated/server";

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
		// Query the Better Auth component for the user
		const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: "user",
			where: [{ field: "email", operator: "eq", value: email.toLowerCase() }],
		});

		if (!user) {
			return null;
		}

		// Get their organization memberships from Better Auth component
		const membershipsResult = await ctx.runQuery(
			components.betterAuth.adapter.findMany,
			{
				model: "member",
				where: [{ field: "userId", operator: "eq", value: user._id }],
				paginationOpts: { cursor: null, numItems: 100 },
			}
		);

		const memberships = membershipsResult.page || [];

		const organizations = await Promise.all(
			memberships.map(async (m: any) => {
				const org = await ctx.runQuery(components.betterAuth.adapter.findOne, {
					model: "organization",
					where: [{ field: "_id", operator: "eq", value: m.organizationId }],
				});
				return org
					? { id: org._id, name: org.name, slug: org.slug, role: m.role }
					: null;
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
	handler: async (ctx, { email, adminSecret }): Promise<any> => {
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

	let body: { email?: string };
	try {
		body = (await request.json()) as { email?: string };
	} catch (error) {
		return new Response(JSON.stringify({ error: "Invalid JSON" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const email = body.email;

	if (!email || typeof email !== "string") {
		return new Response(JSON.stringify({ error: "Email is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const user = await ctx.runQuery(internal.users.findByEmailInternal, {
			email,
		});

		return new Response(JSON.stringify({ user }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: "Query failed",
				message: error instanceof Error ? error.message : String(error),
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
});
