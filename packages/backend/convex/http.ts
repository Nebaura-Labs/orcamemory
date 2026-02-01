import { httpRouter, type HttpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";
import { connect, health } from "./agents";
import {
  forgetMemoriesAction,
  profileAction,
  recordSessionAction,
  searchMemoriesAction,
  startSessionAction,
  storeMemoryAction,
} from "./memory";
import { api } from "./_generated/api";
import { polar } from "./polar";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);
type PolarEvent = {
  data?: {
    customer?: {
      metadata?: Record<string, unknown>;
    };
    product?: {
      metadata?: Record<string, unknown>;
    };
    status?: string;
  };
};

const resolvePlanFromEvent = (event: PolarEvent) => {
  const plan = event.data?.product?.metadata?.plan;
  if (plan === "surface" || plan === "tide" || plan === "abyss") {
    return plan;
  }
  return null;
};

const resolveOrganizationId = (event: PolarEvent) => {
  const value = event.data?.customer?.metadata?.organizationId;
  return typeof value === "string" ? value : null;
};

if (polar) {
  polar.registerRoutes(http as any, {
    onSubscriptionCreated: async (ctx, event) => {
      const organizationId = resolveOrganizationId(event as PolarEvent);
      const plan = resolvePlanFromEvent(event as PolarEvent);
      if (!organizationId || !plan) {
        return;
      }

      await ctx.runMutation(api.plans.setForOrganization, {
        organizationId,
        plan,
      });
    },
    onSubscriptionUpdated: async (ctx, event) => {
      const organizationId = resolveOrganizationId(event as PolarEvent);
      if (!organizationId) {
        return;
      }

      if ((event as PolarEvent).data?.status === "canceled") {
        await ctx.runMutation(api.plans.setForOrganization, {
          organizationId,
          plan: "surface",
        });
        return;
      }

      const plan = resolvePlanFromEvent(event as PolarEvent);
      if (!plan) {
        return;
      }

      await ctx.runMutation(api.plans.setForOrganization, {
        organizationId,
        plan,
      });
    },
  });
}
http.route({
  path: "/api/agents/connect",
  method: "POST",
  handler: connect,
});
http.route({
  path: "/api/agents/health",
  method: "POST",
  handler: health,
});
http.route({
  path: "/api/memory/store",
  method: "POST",
  handler: storeMemoryAction,
});
http.route({
  path: "/api/memory/search",
  method: "POST",
  handler: searchMemoriesAction,
});
http.route({
  path: "/api/memory/forget",
  method: "POST",
  handler: forgetMemoriesAction,
});
http.route({
  path: "/api/memory/profile",
  method: "GET",
  handler: profileAction,
});
http.route({
  path: "/api/sessions/start",
  method: "POST",
  handler: startSessionAction,
});
http.route({
  path: "/api/sessions/record",
  method: "POST",
  handler: recordSessionAction,
});

export default http;
