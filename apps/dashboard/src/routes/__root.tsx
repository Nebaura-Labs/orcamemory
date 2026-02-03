import { initBklit } from "@bklit/sdk";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Outlet,
	Scripts,
	useRouteContext,
	useRouterState,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect } from "react";

const TanStackRouterDevtools = import.meta.env.PROD
	? () => null
	: lazy(() =>
			import("@tanstack/react-router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
			}))
		);

import { env } from "@moltcity/env/web";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";

import appCss from "../index.css?url";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	return await getToken();
});

export interface RouterAppContext {
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				name: "color-scheme",
				content: "light dark",
			},
			{
				name: "theme-color",
				content: "#ffffff",
				media: "(prefers-color-scheme: light)",
			},
			{
				name: "theme-color",
				content: "#0a0a0a",
				media: "(prefers-color-scheme: dark)",
			},
			{
				name: "apple-mobile-web-app-title",
				content: "Orca Memory",
			},
			{
				title: "Orca Memory — Dashboard",
			},
			{
				name: "description",
				content: "Orca Memory dashboard.",
			},
			{
				name: "robots",
				content: "index, follow",
			},
			{
				property: "og:title",
				content: "Orca Memory — Dashboard",
			},
			{
				property: "og:description",
				content: "Orca Memory dashboard.",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:site_name",
				content: "Orca Memory",
			},
			{
				property: "og:url",
				content: "https://orcamemory.com",
			},
			{
				property: "og:image",
				content: "https://orcamemory.com/og-image.png",
			},
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:site",
				content: "@orcamemory",
			},
			{
				name: "twitter:title",
				content: "Orca Memory — Dashboard",
			},
			{
				name: "twitter:description",
				content: "Orca Memory dashboard.",
			},
			{
				name: "twitter:image",
				content: "https://orcamemory.com/og-image.png",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/png",
				href: "/favicon-96x96.png",
				sizes: "96x96",
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
			{
				rel: "shortcut icon",
				href: "/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "manifest",
				href: "/site.webmanifest",
			},
		],
	}),

	component: RootDocument,
	notFoundComponent: NotFoundPage,
	beforeLoad: async (ctx) => {
		// Only fetch auth on server (SSR) - client navigations use cached session
		const isServer = typeof window === "undefined";

		if (!isServer) {
			// On client, skip server round-trip - ConvexBetterAuthProvider handles auth
			// Protected routes have their own beforeLoad that checks isAuthenticated
			return {
				isAuthenticated: true, // Assume authenticated, actual check happens in page beforeLoad
				token: null,
			};
		}

		// Server-side: fetch token for SSR
		let token: string | null = null;
		try {
			token = await Promise.race([
				getAuth(),
				new Promise<null>((resolve) => {
					setTimeout(() => resolve(null), 1500);
				}),
			]);
		} catch {
			token = null;
		}

		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}

		return {
			isAuthenticated: !!token,
			token,
		};
	},
});

function RootDocument() {
	const context = useRouteContext({ from: Route.id });
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});

	const excludedPaths = ["/sign-in", "/sign-up", "/otp", "/onboarding"];
	const showSidebar = !excludedPaths.some((path) => pathname.startsWith(path));

	useEffect(() => {
		const environment =
			env.VITE_BKLIT_ENVIRONMENT ??
			(import.meta.env.DEV ? "development" : "production");
		const debug = env.VITE_BKLIT_DEBUG === "true";

		initBklit({
			projectId: env.VITE_BKLIT_PROJECT_ID,
			apiKey: env.VITE_BKLIT_API_KEY,
			apiHost: env.VITE_BKLIT_API_HOST,
			environment,
			debug,
		});
	}, []);

	return (
		<ConvexBetterAuthProvider
			authClient={authClient}
			client={context.convexQueryClient.convexClient}
			initialToken={context.token}
		>
			<html lang="en">
				<head>
					<HeadContent />
				</head>
				<body>
					{showSidebar ? (
						<SidebarProvider>
							<AppSidebar />
							<SidebarInset>
								<SiteHeader />
								<Outlet />
							</SidebarInset>
						</SidebarProvider>
					) : (
						<div className="h-dvh overflow-hidden">
							<Outlet />
						</div>
					)}
					<Toaster position="bottom-right" richColors />
					{!import.meta.env.PROD && (
						<Suspense>
							<TanStackRouterDevtools position="bottom-left" />
						</Suspense>
					)}
					<Scripts />
				</body>
			</html>
		</ConvexBetterAuthProvider>
	);
}

function NotFoundPage() {
	const context = useRouteContext({ from: Route.id });

	if (context.isAuthenticated) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
				<h1 className="font-bold text-4xl">404</h1>
				<p className="text-muted-foreground">Page not found</p>
				<Button asChild>
					<Link to="/">Back to Dashboard</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-8">
			<h1 className="font-bold text-4xl">404</h1>
			<p className="text-muted-foreground">Page not found</p>
			<Button asChild>
				<Link to="/sign-in">Sign In</Link>
			</Button>
		</div>
	);
}
