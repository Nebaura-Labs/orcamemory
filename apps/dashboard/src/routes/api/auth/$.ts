import { createFileRoute } from "@tanstack/react-router";

import { handler } from "@/lib/auth-server";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => {
				if (process.env.NODE_ENV !== "production") {
					console.log(
						`[auth] ${request.method} ${new URL(request.url).pathname}`
					);
				}
				return handler(request);
			},
			POST: ({ request }) => {
				if (process.env.NODE_ENV !== "production") {
					console.log(
						`[auth] ${request.method} ${new URL(request.url).pathname}`
					);
				}
				return handler(request);
			},
		},
	},
});
