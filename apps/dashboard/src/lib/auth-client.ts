import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@moltcity/env/web";

export const authClient = createAuthClient({
  baseURL: `${env.VITE_SITE_URL}/api/auth`,
  plugins: [convexClient(), emailOTPClient(), organizationClient()],
});
