import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/analytics/")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: AnalyticsPage,
});

function AnalyticsPage() {
	const navigate = useNavigate();
	const { data: organizations, isPending } = authClient.useListOrganizations();

	// Redirect to onboarding if no organizations
	useEffect(() => {
		if (isPending) {
			return;
		}
		if (organizations != null && organizations.length === 0) {
			navigate({ to: "/onboarding" });
		}
	}, [isPending, navigate, organizations]);

	return (
		<main className="min-w-0 flex-1 overflow-hidden p-6">
			<div className="min-w-0 space-y-6 overflow-hidden">
				{/* Header */}
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Analytics</h1>
					<p className="text-muted-foreground text-sm">
						Visualize memory relationships and insights
					</p>
				</div>

				{/* Coming Soon Placeholder */}
				<div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30">
					<Construction className="size-12 text-muted-foreground/50" />
					<h2 className="mt-4 font-medium text-lg">Coming Soon</h2>
					<p className="mt-1 max-w-sm text-center text-muted-foreground text-sm">
						We're building an interactive memory graph to help you visualize
						connections between your agents, sessions, and memories.
					</p>
				</div>
			</div>
		</main>
	);
}
