import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings/team")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: TeamPage,
});

function TeamPage() {
	const navigate = useNavigate();
	const { data: organizations, isPending } = authClient.useListOrganizations();

	useEffect(() => {
		if (isPending) {
			return;
		}
		if (organizations != null && organizations.length === 0) {
			navigate({ to: "/onboarding" });
		}
	}, [isPending, navigate, organizations]);

	return (
		<main className="flex-1 p-6">
			<div className="space-y-6">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">Team</h1>
					<p className="text-muted-foreground text-sm">
						Manage team members and permissions
					</p>
				</div>

				{/* Coming Soon Placeholder */}
				<div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30">
					<Construction className="size-12 text-muted-foreground/50" />
					<h2 className="mt-4 font-medium text-lg">Coming Soon</h2>
					<p className="mt-1 max-w-sm text-center text-muted-foreground text-sm">
						Invite team members, manage roles, and collaborate on your AI memory projects.
					</p>
				</div>
			</div>
		</main>
	);
}
