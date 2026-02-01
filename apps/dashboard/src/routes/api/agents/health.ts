import { createFileRoute } from "@tanstack/react-router";

const resolveTargetUrl = () => {
  const baseUrl = import.meta.env.VITE_CONVEX_SITE_URL;
  if (!baseUrl) {
    throw new Error("VITE_CONVEX_SITE_URL is not configured.");
  }
  return `${baseUrl.replace(/\/$/, "")}/api/agents/health`;
};

export const Route = createFileRoute("/api/agents/health")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const targetUrl = resolveTargetUrl();
        const body = await request.text();
        const contentType = request.headers.get("content-type") ?? "application/json";

        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": contentType,
            Accept: "application/json",
          },
          body,
        });

        const responseBody = await response.text();
        return new Response(responseBody, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("content-type") ?? "application/json",
          },
        });
      },
    },
  },
});
