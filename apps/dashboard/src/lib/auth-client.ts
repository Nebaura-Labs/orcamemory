import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@moltcity/env/web";

const resolveBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return env.VITE_SITE_URL ?? env.VITE_INTERNAL_SITE_URL ?? "";
};

const baseUrl = resolveBaseUrl();

export const authClient = createAuthClient({
  baseURL: baseUrl ? `${baseUrl}/api/auth` : undefined,
  plugins: [convexClient(), emailOTPClient(), organizationClient()],
});
