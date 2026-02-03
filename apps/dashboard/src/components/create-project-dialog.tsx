import { api } from "@moltcity/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button onClick={() => setOpen(true)}>Create project</Button>
			</DialogTrigger>
			<DialogContent className="border border-primary border-dashed p-0 sm:max-w-lg">
				<DialogHeader className="px-6 pt-4">
					<DialogTitle className="font-semibold text-foreground text-lg">
						Create project
					</DialogTitle>
					<DialogDescription className="mt-2 text-muted-foreground text-sm leading-6">
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
							<Label className="font-medium text-sm" htmlFor="project-name">
								Project name<span className="text-destructive">*</span>
							</Label>
							<Input
								className="mt-2"
								id="project-name"
								name="project-name"
								onChange={(event) => setProjectName(event.target.value)}
								placeholder="Memory Ops"
								required
								type="text"
								value={projectName}
							/>
						</div>
						<div>
							<Label
								className="font-medium text-sm"
								htmlFor="project-description"
							>
								Description
							</Label>
							<Textarea
								className="mt-2 min-h-[96px] border-dashed"
								id="project-description"
								name="project-description"
								onChange={(event) => setProjectDescription(event.target.value)}
								placeholder="What is this project for?"
								value={projectDescription}
							/>
						</div>
						<div>
							<Label className="font-medium text-sm" htmlFor="retention-policy">
								Memory retention
								{retentionLimits?.maxDays && (
									<span className="ml-2 text-muted-foreground text-xs">
										(max {retentionLimits.maxDays} days on{" "}
										{retentionLimits.plan} plan)
									</span>
								)}
							</Label>
							<Select onValueChange={setRetention} value={retention}>
								<SelectTrigger
									className="mt-2 w-full border-dashed"
									id="retention-policy"
								>
									<SelectValue placeholder="Select a policy" />
								</SelectTrigger>
								<SelectContent
									align="start"
									alignItemWithTrigger={false}
									className="!border !border-dashed !border-input !ring-0 !shadow-none bg-card"
									side="bottom"
									sideOffset={8}
								>
									{allRetentionOptions.map((option) => {
										const isAllowed = allowedOptions.includes(option.value);
										return (
											<SelectItem
												className={isAllowed ? "" : "opacity-50"}
												disabled={!isAllowed}
												key={option.value}
												value={option.value}
											>
												<span className="flex items-center gap-2">
													{option.label}
													{!isAllowed && (
														<Badge
															className="px-1 py-0 text-[10px]"
															variant="outline"
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
							<p className="text-destructive text-xs">{statusMessage}</p>
						) : null}
						<Button className="w-full" disabled={isSubmitting} type="submit">
							{isSubmitting ? "Creating..." : "Create project"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
