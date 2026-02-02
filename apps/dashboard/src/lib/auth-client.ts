import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Use frontend origin - auth requests go through the SSR proxy at /api/auth/*
const resolveBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};

export const authClient = createAuthClient({
  baseURL: `${resolveBaseUrl()}/api/auth`,
  plugins: [convexClient(), emailOTPClient(), organizationClient()],
});
