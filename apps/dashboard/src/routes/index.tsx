import { api } from "@moltcity/backend/convex/_generated/api";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { AgentStatus } from "@/components/agent-status";
import { BetaWelcomeDialog } from "@/components/beta-welcome-dialog";
import { QuickActions } from "@/components/quick-actions";
import { RecentMemories } from "@/components/recent-memories";
import { StatsCards } from "@/components/stats-cards";
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
	const { data: organizations, isPending: isOrgsPending } =
		authClient.useListOrganizations();
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
		// Wait for organizations to finish loading
		if (isOrgsPending) return;
		// Only redirect if loaded and empty (not just undefined)
		if (organizations !== undefined && organizations.length === 0) {
			void navigate({ to: "/onboarding" });
		}
	}, [isOrgsPending, navigate, organizations]);

	const isLoading = isOrgsPending || stats === undefined;

	return (
		<main className="flex-1 p-6">
			<BetaWelcomeDialog />
			<div className="space-y-6">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground text-sm">
						Overview of your memory infrastructure
					</p>
				</div>

				{isLoading ? (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{[1, 2, 3, 4].map((i) => (
							<div
								className="h-32 animate-pulse rounded-none bg-card ring-1 ring-foreground/10"
								key={i}
							/>
						))}
					</div>
				) : (
					<StatsCards
						sessionCount={stats?.sessionCount ?? 0}
						tokenLimit={stats?.tokenLimit ?? 500_000}
						tokenUsage={stats?.tokenUsage ?? 0}
						totalAgents={stats?.totalAgents ?? 0}
						totalMemories={stats?.totalMemories ?? 0}
					/>
				)}

				<div className="grid gap-6 lg:grid-cols-2">
					{recentMemories === undefined ? (
						<div className="h-64 animate-pulse rounded-none bg-card ring-1 ring-foreground/10" />
					) : (
						<RecentMemories memories={recentMemories ?? []} />
					)}

					{agentStatus === undefined ? (
						<div className="h-64 animate-pulse rounded-none bg-card ring-1 ring-foreground/10" />
					) : (
						<AgentStatus agents={agentStatus ?? []} />
					)}
				</div>

				<QuickActions />
			</div>
		</main>
	);
}
