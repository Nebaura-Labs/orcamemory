import { Polar } from "@convex-dev/polar";

import { api, components } from "./_generated/api";

const polarToken = process.env.POLAR_ORGANIZATION_TOKEN;
const polarWebhookSecret = process.env.POLAR_WEBHOOK_SECRET;
const polarServer = process.env.POLAR_SERVER;
const surfaceProductId = process.env.POLAR_PRODUCT_SURFACE_ID;
const tideProductId = process.env.POLAR_PRODUCT_TIDE_ID;
const abyssProductId = process.env.POLAR_PRODUCT_ABYSS_ID;

// Only initialize Polar if all required configuration is present
const isPolarConfigured =
	polarToken &&
	polarWebhookSecret &&
	surfaceProductId &&
	tideProductId &&
	abyssProductId;

export const polar = isPolarConfigured
	? new Polar(components.polar, {
			organizationToken: polarToken,
			webhookSecret: polarWebhookSecret,
			server: polarServer as "sandbox" | "production" | undefined,
			getUserInfo: async (
				ctx
			): Promise<{ userId: string; email: string; name?: string }> => {
				const user: any = await ctx.runQuery(api.users.getCurrentUser);
				if (!user) {
					throw new Error("User not authenticated.");
				}

				return {
					userId: user.id,
					email: user.email,
					name: user.name ?? undefined,
				};
			},
			products: {
				surface: surfaceProductId,
				tide: tideProductId,
				abyss: abyssProductId,
			},
		})
	: null;

export const requirePolar = () => {
	if (!polar) {
		throw new Error("Polar is not configured.");
	}
	return polar;
};
