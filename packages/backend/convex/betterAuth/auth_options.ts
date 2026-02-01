import { emailOTP, organization } from "better-auth/plugins";
import { convex } from "@convex-dev/better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import type { GenericCtx } from "@convex-dev/better-auth";
import { convexAdapter } from "@convex-dev/better-auth";

export const createAuthOptions = (_ctx?: GenericCtx<any>): BetterAuthOptions => ({
  database: convexAdapter({} as never, {} as never),
  rateLimit: {
    storage: "database",
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: async () => true,
      requireEmailVerificationOnInvitation: true,
    }),
    emailOTP({ sendVerificationOTP: async () => {} }),
    convex({
      authConfig: { providers: [{ applicationID: "convex", domain: "" }] },
    }),
  ],
});
