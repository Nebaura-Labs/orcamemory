import { api } from "@moltcity/backend/convex/_generated/api";
import type { Id } from "@moltcity/backend/convex/_generated/dataModel";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { AgentsTable } from "@/components/agents-table";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/agents/")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: AgentsPage,
});

function AgentsPage() {
	const navigate = useNavigate();
	const { data: organizations, isPending } = authClient.useListOrganizations();
	const organizationId = organizations?.[0]?.id ?? "";

	const projects = useQuery(
		api.projects.listByOrganization,
		organizationId ? { organizationId } : "skip"
	) as { _id: Id<"projects">; name: string }[] | undefined;

	const [activeProjectId, setActiveProjectId] = useState<Id<"projects"> | null>(
		null
	);

	useEffect(() => {
		if (isPending) {
			return;
		}
		if (!organizations?.length) {
			navigate({ to: "/onboarding" });
		}
	}, [isPending, navigate, organizations]);

	useEffect(() => {
		if (projects?.length && !activeProjectId) {
			const stored = localStorage.getItem(
				"activeProjectId"
			) as Id<"projects"> | null;
			const found = stored ? projects.find((p) => p._id === stored) : null;
			setActiveProjectId(found?._id ?? projects[0]._id);
		}
	}, [projects, activeProjectId]);

	const isLoading = isPending || projects === undefined || !activeProjectId;

	return (
		<main className="flex-1 p-6">
			<div className="space-y-6">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Agents</h1>
					<p className="text-muted-foreground text-sm">
						Manage your connected agents and API keys
					</p>
				</div>

				{isLoading ? (
					<div className="h-96 animate-pulse rounded-none bg-card ring-1 ring-foreground/10" />
				) : (
					<AgentsTable projectId={activeProjectId} />
				)}
			</div>
		</main>
	);
}
