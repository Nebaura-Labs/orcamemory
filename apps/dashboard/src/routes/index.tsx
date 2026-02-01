import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";

import { AgentStatus } from "@/components/agent-status";
import { QuickActions } from "@/components/quick-actions";
import { RecentMemories } from "@/components/recent-memories";
import { StatsCards } from "@/components/stats-cards";
import { authClient } from "@/lib/auth-client";
import { api } from "@moltcity/backend/convex/_generated/api";

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
  const organizationId = organizations?.[0]?.id ?? "";

  const stats = useQuery(
    api.dashboard.getStats,
    organizationId ? { organizationId } : "skip"
  );

  const recentMemories = useQuery(
    api.dashboard.getRecentMemories,
    organizationId ? { organizationId, limit: 5 } : "skip"
  );

  const agentStatus = useQuery(
    api.dashboard.getAgentStatus,
    organizationId ? { organizationId, limit: 4 } : "skip"
  );

  useEffect(() => {
    if (isPending) return;
    if (!organizations?.length) {
      void navigate({ to: "/onboarding" });
    }
  }, [isPending, navigate, organizations]);

  const isLoading = isPending || stats === undefined;

  return (
    <main className="flex-1 p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your memory infrastructure
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card ring-foreground/10 h-32 animate-pulse rounded-none ring-1"
              />
            ))}
          </div>
        ) : (
          <StatsCards
            totalMemories={stats?.totalMemories ?? 0}
            totalAgents={stats?.totalAgents ?? 0}
            sessionCount={stats?.sessionCount ?? 0}
            tokenUsage={stats?.tokenUsage ?? 0}
            tokenLimit={stats?.tokenLimit ?? 500000}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {recentMemories === undefined ? (
            <div className="bg-card ring-foreground/10 h-64 animate-pulse rounded-none ring-1" />
          ) : (
            <RecentMemories memories={recentMemories ?? []} />
          )}

          {agentStatus === undefined ? (
            <div className="bg-card ring-foreground/10 h-64 animate-pulse rounded-none ring-1" />
          ) : (
            <AgentStatus agents={agentStatus ?? []} />
          )}
        </div>

        <QuickActions />
      </div>
    </main>
  );
}
