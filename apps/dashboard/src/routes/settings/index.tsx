import { api } from "@moltcity/backend/convex/_generated/api";
import type { Id } from "@moltcity/backend/convex/_generated/dataModel";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/settings/")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: SettingsPage,
});

function SettingsPage() {
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

	const isLoading = isPending || projects === undefined || !activeProjectId;

	return (
		<main className="flex-1 p-6">
			<div className="space-y-6">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						General Settings
					</h1>
					<p className="text-muted-foreground text-sm">
						Manage your project settings and configuration
					</p>
				</div>

				{isLoading ? (
					<div className="space-y-6">
						<div className="h-64 animate-pulse rounded-lg bg-card ring-1 ring-foreground/10" />
						<div className="h-48 animate-pulse rounded-lg bg-card ring-1 ring-foreground/10" />
					</div>
				) : (
					<SettingsForm projectId={activeProjectId} />
				)}
			</div>
		</main>
	);
}

function SettingsForm({ projectId }: { projectId: Id<"projects"> }) {
	const navigate = useNavigate();
	const project = useQuery(api.projects.get, { projectId });
	const updateProject = useMutation(api.projects.update);
	const deleteProject = useMutation(api.projects.remove);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");

	useEffect(() => {
		if (project) {
			setName(project.name);
			setDescription(project.description ?? "");
		}
	}, [project]);

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("Project name is required");
			return;
		}

		setIsSaving(true);
		try {
			await updateProject({
				projectId,
				name: name.trim(),
				description: description.trim() || null,
			});
			toast.success("Settings saved");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save settings"
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (deleteConfirmation !== project?.name) {
			toast.error("Project name doesn't match");
			return;
		}

		setIsDeleting(true);
		try {
			await deleteProject({ projectId });
			localStorage.removeItem("activeProjectId");
			toast.success("Project deleted");
			navigate({ to: "/" });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete project"
			);
		} finally {
			setIsDeleting(false);
		}
	};

	if (!project) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const hasChanges =
		name !== project.name || description !== (project.description ?? "");

	return (
		<div className="space-y-6">
			{/* Project Details */}
			<Card>
				<CardHeader>
					<CardTitle>Project Details</CardTitle>
					<CardDescription>
						Update your project name and description
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Project Name</Label>
						<Input
							id="name"
							onChange={(e) => setName(e.target.value)}
							placeholder="My Project"
							value={name}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							className="min-h-24 resize-none"
							id="description"
							onChange={(e) => setDescription(e.target.value)}
							placeholder="A brief description of your project..."
							value={description}
						/>
					</div>
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

			{/* Project Info */}
			<Card>
				<CardHeader>
					<CardTitle>Project Information</CardTitle>
					<CardDescription>
						Technical details about your project
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label className="text-muted-foreground text-xs">Project ID</Label>
						<div className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
							{projectId}
						</div>
					</div>
					<div className="space-y-2">
						<Label className="text-muted-foreground text-xs">Created</Label>
						<div className="text-sm">
							{new Date(project.createdAt).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</div>
					</div>
					<div className="space-y-2">
						<Label className="text-muted-foreground text-xs">
							API Endpoint
						</Label>
						<div className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
							https://orcamemory.com/v1
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="border-destructive/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="size-5" />
						Danger Zone
					</CardTitle>
					<CardDescription>
						Irreversible and destructive actions
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
						<div>
							<p className="font-medium">Delete this project</p>
							<p className="text-muted-foreground text-sm">
								Once deleted, all project data will be permanently removed.
							</p>
						</div>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive">Delete Project</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. This will permanently delete
										the project <strong>{project.name}</strong> and all
										associated data including agents, memories, and sessions.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<div className="space-y-2 py-4">
									<Label htmlFor="confirm">
										Type <strong>{project.name}</strong> to confirm
									</Label>
									<Input
										id="confirm"
										onChange={(e) => setDeleteConfirmation(e.target.value)}
										placeholder={project.name}
										value={deleteConfirmation}
									/>
								</div>
								<AlertDialogFooter>
									<AlertDialogCancel onClick={() => setDeleteConfirmation("")}>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
										disabled={deleteConfirmation !== project.name || isDeleting}
										onClick={handleDelete}
									>
										{isDeleting ? (
											<Loader2 className="mr-2 size-4 animate-spin" />
										) : null}
										Delete Project
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
