import { api } from "@moltcity/backend/convex/_generated/api";
import type { Id } from "@moltcity/backend/convex/_generated/dataModel";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Clock, Hourglass, Info, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings/retention")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: RetentionPage,
});

const ALL_RETENTION_OPTIONS = [
	{ value: "Keep Forever", label: "Keep Forever", days: null },
	{ value: "One Year", label: "One Year", days: 365 },
	{ value: "Six Months", label: "Six Months", days: 180 },
	{ value: "90 Days", label: "90 Days", days: 90 },
	{ value: "30 Days", label: "30 Days", days: 30 },
] as const;

function RetentionPage() {
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
		if (isPending) return;
		if (organizations != null && organizations.length === 0) {
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

	const isLoading = isPending || projects === undefined || !activeProjectId || !organizationId;

	return (
		<main className="flex-1 p-6">
			<div className="space-y-6">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						Memory Retention
					</h1>
					<p className="text-muted-foreground text-sm">
						Configure how long memories are stored before automatic cleanup
					</p>
				</div>

				{isLoading ? (
					<div className="space-y-6">
						<div className="h-64 animate-pulse rounded-lg bg-card ring-1 ring-foreground/10" />
						<div className="h-48 animate-pulse rounded-lg bg-card ring-1 ring-foreground/10" />
					</div>
				) : (
					<RetentionForm projectId={activeProjectId} organizationId={organizationId} />
				)}
			</div>
		</main>
	);
}

function RetentionForm({
	projectId,
	organizationId,
}: {
	projectId: Id<"projects">;
	organizationId: string;
}) {
	const project = useQuery(api.projects.get, { projectId });
	const retentionLimits = useQuery(api.plans.getRetentionLimits, { organizationId });
	const updateProject = useMutation(api.projects.update);

	const [retention, setRetention] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (project) {
			setRetention(project.memoryRetention);
		}
	}, [project]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateProject({
				projectId,
				memoryRetention: retention,
			});
			toast.success("Retention settings saved");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save settings"
			);
		} finally {
			setIsSaving(false);
		}
	};

	if (!project || !retentionLimits) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const hasChanges = retention !== project.memoryRetention;
	const allowedOptions = retentionLimits.allowedOptions;
	const currentOption = ALL_RETENTION_OPTIONS.find((o) => o.value === retention);
	const planName = retentionLimits.plan.charAt(0).toUpperCase() + retentionLimits.plan.slice(1);

	return (
		<div className="space-y-6">
			{/* Retention Policy */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock className="size-5" />
						Retention Policy
					</CardTitle>
					<CardDescription>
						Choose how long to keep memories before they are automatically deleted
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="retention">Memory Retention Period</Label>
						<Select onValueChange={setRetention} value={retention}>
							<SelectTrigger className="w-full md:w-64">
								<SelectValue placeholder="Select retention period" />
							</SelectTrigger>
							<SelectContent>
								{ALL_RETENTION_OPTIONS.map((option) => {
									const isAllowed = allowedOptions.includes(option.value);
									return (
										<SelectItem
											disabled={!isAllowed}
											key={option.value}
											value={option.value}
										>
											<div className="flex items-center gap-2">
												<span>{option.label}</span>
												{!isAllowed && (
													<Badge className="ml-2 text-xs" variant="outline">
														Upgrade
													</Badge>
												)}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
						{currentOption && currentOption.days !== null && (
							<p className="text-muted-foreground text-sm">
								Memories older than {currentOption.days} days will be automatically deleted
							</p>
						)}
						{currentOption && currentOption.days === null && (
							<p className="text-muted-foreground text-sm">
								Memories will be kept indefinitely until manually deleted
							</p>
						)}
					</div>

					{!allowedOptions.includes("Keep Forever") && (
						<Alert className="border-dashed">
							<Hourglass className="size-4" />
							<AlertDescription>
								<span className="font-medium">Want longer retention?</span> Upgrade your plan to
								access extended retention periods including unlimited storage.
							</AlertDescription>
						</Alert>
					)}
				</CardContent>
				<CardFooter className="border-t pt-6">
					<Button disabled={!hasChanges || isSaving} onClick={handleSave}>
						{isSaving ? (
							<Loader2 className="mr-2 size-4 animate-spin" />
						) : (
							<Save className="mr-2 size-4" />
						)}
						Save Changes
					</Button>
				</CardFooter>
			</Card>

			{/* Plan Information */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Info className="size-5" />
						Plan Limits
					</CardTitle>
					<CardDescription>
						Your current plan determines available retention options
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between rounded-lg border border-dashed p-4">
						<div>
							<p className="font-medium">Current Plan</p>
							<p className="text-muted-foreground text-sm">
								{planName} Plan
							</p>
						</div>
						<Badge variant="secondary">{planName}</Badge>
					</div>

					<div className="space-y-2">
						<Label className="text-muted-foreground text-xs">
							Maximum Retention
						</Label>
						<div className="text-sm">
							{retentionLimits.maxDays === null
								? "Unlimited (Keep Forever)"
								: `${retentionLimits.maxDays} days`}
						</div>
					</div>

					<div className="space-y-2">
						<Label className="text-muted-foreground text-xs">
							Available Options
						</Label>
						<div className="flex flex-wrap gap-2">
							{allowedOptions.map((option) => (
								<Badge key={option} variant="outline">
									{option}
								</Badge>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* How It Works */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertCircle className="size-5" />
						How Retention Works
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-muted-foreground text-sm">
					<p>
						Memory retention controls how long your agent memories are stored in the system.
						When a memory exceeds the retention period, it is automatically deleted during
						the next cleanup cycle.
					</p>
					<p>
						Cleanup runs periodically to remove expired memories. This helps manage storage
						costs and keeps your memory database lean and relevant.
					</p>
					<p className="font-medium text-foreground">
						Note: Changing the retention period only affects future cleanup cycles. Existing
						memories that exceed the new retention period will be deleted in the next cycle.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
