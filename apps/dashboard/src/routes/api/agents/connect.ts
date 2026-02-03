import { createFileRoute } from "@tanstack/react-router";

const resolveTargetUrl = () => {
	const baseUrl = import.meta.env.VITE_CONVEX_SITE_URL;
	if (!baseUrl) {
		throw new Error("VITE_CONVEX_SITE_URL is not configured.");
	}
	return `${baseUrl.replace(/\/$/, "")}/api/agents/connect`;
};

export const Route = createFileRoute("/api/agents/connect")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				console.log("[api/agents/connect] POST handler called");
				try {
					const targetUrl = resolveTargetUrl();
					console.log("[api/agents/connect] Target URL:", targetUrl);
					const body = await request.text();
					const contentType =
						request.headers.get("content-type") ?? "application/json";

					const response = await fetch(targetUrl, {
						method: "POST",
						headers: {
							"Content-Type": contentType,
							Accept: "application/json",
						},
						body,
					});

					console.log("[api/agents/connect] Response status:", response.status);
					const responseBody = await response.text();
					return new Response(responseBody, {
						status: response.status,
						headers: {
							"Content-Type":
								response.headers.get("content-type") ?? "application/json",
						},
					});
				} catch (error) {
					console.error("[api/agents/connect] Error:", error);
					return new Response(JSON.stringify({ error: String(error) }), {
						status: 500,
						headers: { "Content-Type": "application/json" },
					});
				}
			},
		},
	},
});
