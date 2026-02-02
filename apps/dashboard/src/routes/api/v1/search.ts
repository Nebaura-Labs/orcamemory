import { createFileRoute } from "@tanstack/react-router";

const resolveTargetUrl = () => {
  const baseUrl = import.meta.env.VITE_CONVEX_SITE_URL;
  if (!baseUrl) {
    throw new Error("VITE_CONVEX_SITE_URL is not configured.");
  }
  return `${baseUrl.replace(/\/$/, "")}/api/memory/search`;
};

const forwardHeaders = (request: Request) => {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }
  const keyId = request.headers.get("x-orca-key-id");
  if (keyId) {
    headers.set("X-Orca-Key-Id", keyId);
  }
  headers.set("Accept", "application/json");
  return headers;
};

export const Route = createFileRoute("/api/v1/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const targetUrl = resolveTargetUrl();
        const body = await request.text();
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: forwardHeaders(request),
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
