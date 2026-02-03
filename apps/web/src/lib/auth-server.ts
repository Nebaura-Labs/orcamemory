import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";
import { env } from "@moltcity/env/web";

const resolveSiteUrl = () => {
	if (typeof window === "undefined") {
		return env.VITE_INTERNAL_SITE_URL ?? env.VITE_CONVEX_SITE_URL;
	}
	return env.VITE_CONVEX_SITE_URL;
};

export const {
	handler,
	getToken,
	fetchAuthQuery,
	fetchAuthMutation,
	fetchAuthAction,
} = convexBetterAuthReactStart({
	convexUrl: env.VITE_CONVEX_URL,
	convexSiteUrl: resolveSiteUrl(),
});
