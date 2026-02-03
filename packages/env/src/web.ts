import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_CONVEX_URL: z.url(),
		VITE_CONVEX_SITE_URL: z.url(),
		VITE_SITE_URL: z.url(),
		VITE_BKLIT_PROJECT_ID: z.string().min(1),
		VITE_BKLIT_API_KEY: z.string().min(1),
		VITE_BKLIT_API_HOST: z.string().url().optional(),
		VITE_BKLIT_ENVIRONMENT: z.enum(["development", "production"]).optional(),
		VITE_BKLIT_DEBUG: z.enum(["true", "false"]).optional(),
		VITE_INTERNAL_SITE_URL: z.string().url().optional(),
	},
	runtimeEnv: (import.meta as any).env,
	emptyStringAsUndefined: true,
});
