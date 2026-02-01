import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: organizations, isPending } = authClient.useListOrganizations();

  useEffect(() => {
    if (isPending) return;
    if (!organizations?.length) {
      void navigate({ to: "/onboarding" });
    }
  }, [isPending, navigate, organizations]);

  return (
    <main className="min-h-svh bg-background">
      <section className="mx-auto flex min-h-svh w-full max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
          Dashboard
        </h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          You’re signed in. We’ll build this next.
        </p>
      </section>
    </main>
  );
}
