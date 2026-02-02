import type { FormEvent } from "react";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { api } from "@moltcity/backend/convex/_generated/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type CreateProjectDialogProps = {
	onCreated?: () => void;
};

export function CreateProjectDialog({ onCreated }: CreateProjectDialogProps) {
	const [open, setOpen] = useState(false);
	const createProject = useMutation(api.projects.create);
	const { data: organizations } = authClient.useListOrganizations();
	const organizationId = organizations?.[0]?.id ?? "";

	// Get retention limits based on the user's plan
	const retentionLimits = useQuery(
		api.plans.getRetentionLimits,
		organizationId ? { organizationId } : "skip"
	);

	const [projectName, setProjectName] = useState("");
	const [projectDescription, setProjectDescription] = useState("");
	const [retention, setRetention] = useState("");
	const memoryTypes = ["conversations", "decisions", "preferences", "facts"];
	const sessionLoggingEnabled = true;
	const memoryCurrentEnabled = false;
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// All retention options in order from longest to shortest
	const allRetentionOptions = [
		{ value: "Keep Forever", label: "Keep Forever", days: null },
		{ value: "One Year", label: "One Year", days: 365 },
		{ value: "Six Months", label: "Six Months", days: 180 },
		{ value: "90 Days", label: "90 Days", days: 90 },
		{ value: "30 Days", label: "30 Days", days: 30 },
	];

	const allowedOptions = retentionLimits?.allowedOptions ?? ["30 Days"];

	// Set default retention to the first allowed option when limits load
	useEffect(() => {
		if (allowedOptions.length > 0 && !retention) {
			setRetention(allowedOptions[0]);
		}
	}, [allowedOptions, retention]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button onClick={() => setOpen(true)}>Create project</Button>
			</DialogTrigger>
			<DialogContent className="border border-dashed border-primary p-0 sm:max-w-lg">
				<DialogHeader className="px-6 pt-4">
					<DialogTitle className="text-lg font-semibold text-foreground">
						Create project
					</DialogTitle>
					<DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
						Projects keep your agents, data sources, and memory settings
						organized.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={async (event: FormEvent<HTMLFormElement>) => {
						event.preventDefault();
						setStatusMessage(null);

						if (!organizationId) {
							setStatusMessage("Create a workspace first.");
							return;
						}

						const trimmedName = projectName.trim();
						if (!trimmedName) {
							setStatusMessage("Enter a project name.");
							return;
						}

						setIsSubmitting(true);
						try {
							await createProject({
								organizationId,
								name: trimmedName,
								description: projectDescription.trim() || null,
								memoryRetention: retention,
								memoryTypes,
								sessionLoggingEnabled,
								memoryCurrentEnabled,
							});
							toast.success("Project created.");
							onCreated?.();
							setOpen(false);
							setProjectName("");
							setProjectDescription("");
						} catch {
							const message = "Unable to create project. Try again.";
							setStatusMessage(message);
							toast.error(message);
						} finally {
							setIsSubmitting(false);
						}
					}}
				>
					<div className="space-y-4 px-6 pb-4">
						<div>
							<Label htmlFor="project-name" className="text-sm font-medium">
								Project name<span className="text-destructive">*</span>
							</Label>
							<Input
								type="text"
								id="project-name"
								name="project-name"
								placeholder="Memory Ops"
								className="mt-2"
								required
								value={projectName}
								onChange={(event) => setProjectName(event.target.value)}
							/>
						</div>
						<div>
							<Label
								htmlFor="project-description"
								className="text-sm font-medium"
							>
								Description
							</Label>
							<Textarea
								id="project-description"
								name="project-description"
								placeholder="What is this project for?"
								className="mt-2 min-h-[96px] border-dashed"
								value={projectDescription}
								onChange={(event) => setProjectDescription(event.target.value)}
							/>
						</div>
						<div>
							<Label htmlFor="retention-policy" className="text-sm font-medium">
								Memory retention
								{retentionLimits?.maxDays && (
									<span className="ml-2 text-xs text-muted-foreground">
										(max {retentionLimits.maxDays} days on{" "}
										{retentionLimits.plan} plan)
									</span>
								)}
							</Label>
							<Select value={retention} onValueChange={setRetention}>
								<SelectTrigger
									id="retention-policy"
									className="mt-2 w-full border-dashed"
								>
									<SelectValue placeholder="Select a policy" />
								</SelectTrigger>
								<SelectContent
									side="bottom"
									sideOffset={8}
									align="start"
									alignItemWithTrigger={false}
									className="bg-card !border !border-dashed !border-input !ring-0 !shadow-none"
								>
									{allRetentionOptions.map((option) => {
										const isAllowed = allowedOptions.includes(option.value);
										return (
											<SelectItem
												key={option.value}
												value={option.value}
												disabled={!isAllowed}
												className={!isAllowed ? "opacity-50" : ""}
											>
												<span className="flex items-center gap-2">
													{option.label}
													{!isAllowed && (
														<Badge
															variant="outline"
															className="text-[10px] px-1 py-0"
														>
															Upgrade
														</Badge>
													)}
												</span>
											</SelectItem>
										);
									})}
								</SelectContent>
							</Select>
						</div>
						{statusMessage ? (
							<p className="text-xs text-destructive">{statusMessage}</p>
						) : null}
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? "Creating..." : "Create project"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
