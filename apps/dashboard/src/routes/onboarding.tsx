import { api } from "@moltcity/backend/convex/_generated/api";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { Onboarding01 } from "@/components/onboarding-01";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/onboarding")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: OnboardingPage,
});

function OnboardingPage() {
	const { data: organizations, isPending } = authClient.useListOrganizations();
	const organizationId = organizations?.[0]?.id ?? "";
	const projects = useQuery(
		api.projects.listByOrganization,
		organizationId ? { organizationId } : "skip"
	);
	const projectId = projects?.[0]?._id;
	const status = useQuery(
		api.agents.getStatusByProject,
		projectId ? { projectId } : "skip"
	);

	if (isPending) {
		return (
			<main className="min-h-svh bg-background">
				<div className="mx-auto flex min-h-svh max-w-lg items-center justify-center px-6">
					<p className="text-muted-foreground text-sm">
						Loading your account...
					</p>
				</div>
			</main>
		);
	}

	return (
		<Onboarding01
			agentConnected={Boolean(status?.connected)}
			projectCompleted={Boolean(projects?.length)}
			workspaceCompleted={Boolean(organizations?.length)}
		/>
	);
}
