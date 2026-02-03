import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { env } from "@moltcity/env/web";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Use frontend origin - auth requests go through the SSR proxy at /api/auth/*
const resolveBaseUrl = () => {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	// Server-side: use VITE_SITE_URL for SSR
	return env.VITE_SITE_URL ?? "";
};

export const authClient = createAuthClient({
	baseURL: `${resolveBaseUrl()}/api/auth`,
	plugins: [convexClient(), emailOTPClient(), organizationClient()],
});
