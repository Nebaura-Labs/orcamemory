import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@moltcity/env/web";

// Use Convex site URL for auth (where Better Auth runs)
const baseUrl = env.VITE_CONVEX_SITE_URL;

export const authClient = createAuthClient({
  baseURL: baseUrl ? `${baseUrl}/api/auth` : undefined,
  plugins: [convexClient(), emailOTPClient(), organizationClient()],
});
