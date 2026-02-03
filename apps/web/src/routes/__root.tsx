import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { initBklit } from "@bklit/sdk";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";
import { env } from "@moltcity/env/web";

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
        title: "Orca Memory — Memory infrastructure for OpenClaw agents",
      },
      {
        name: "description",
        content:
          "Memory infrastructure for OpenClaw agents. Persist memories across sessions, search semantically, and maintain context over time.",
      },
      {
        name: "robots",
        content: "index, follow",
      },
      {
        property: "og:title",
        content: "Orca Memory — Memory infrastructure for OpenClaw agents",
      },
      {
        property: "og:description",
        content:
          "Memory infrastructure for OpenClaw agents. Persist memories across sessions, search semantically, and maintain context over time.",
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
        content: "Orca Memory — Memory infrastructure for OpenClaw agents",
      },
      {
        name: "twitter:description",
        content:
          "Memory infrastructure for OpenClaw agents. Persist memories across sessions, search semantically, and maintain context over time.",
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
  beforeLoad: async (ctx) => {
    let token: string | null = null;
    try {
      token = await Promise.race([
        getAuth(),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 3000);
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
  const isHome = useRouterState({
    select: (state) => state.location.pathname === "/",
  });

  useEffect(() => {
    const environment =
      env.VITE_BKLIT_ENVIRONMENT ?? (import.meta.env.DEV ? "development" : "production");
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
      client={context.convexQueryClient.convexClient}
      authClient={authClient}
      initialToken={context.token}
    >
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          <div
            className={
              isHome
                ? "h-dvh overflow-hidden"
                : "grid h-svh grid-rows-[auto_1fr]"
            }
          >
            <Outlet />
          </div>
          <Toaster richColors />
          <TanStackRouterDevtools position="bottom-left" />
          <Scripts />
        </body>
      </html>
    </ConvexBetterAuthProvider>
  );
}
