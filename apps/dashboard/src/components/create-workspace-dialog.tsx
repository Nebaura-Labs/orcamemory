import { api } from "@moltcity/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { authClient } from "@/lib/auth-client";

const slugify = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.slice(0, 48);

type CreateWorkspaceDialogProps = {
	onCreated?: () => void;
};

export function CreateWorkspaceDialog({
	onCreated,
}: CreateWorkspaceDialogProps) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const ensurePlan = useMutation(api.plans.ensurePlanForOrganization);

	const slugValue = useMemo(() => slugify(name), [name]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setStatusMessage(null);

		const trimmedName = name.trim();
		if (!trimmedName) {
			setStatusMessage("Enter a workspace name.");
			return;
		}

		setIsSubmitting(true);
		try {
			const organization = await authClient.organization.create({
				name: trimmedName,
				slug: slugValue || trimmedName.toLowerCase(),
			});
			if (organization?.id) {
				await ensurePlan({ organizationId: organization.id });
			}
			toast.success("Workspace created.");
			onCreated?.();
			setOpen(false);
			setName("");
		} catch {
			const message = "Unable to create workspace. Try again.";
			setStatusMessage(message);
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button onClick={() => setOpen(true)}>Create workspace</Button>
			</DialogTrigger>
			<DialogContent className="border border-primary border-dashed p-0 sm:max-w-lg">
				<DialogHeader className="px-6 pt-4">
					<DialogTitle className="font-semibold text-foreground text-lg">
						Create workspace
					</DialogTitle>
					<DialogDescription className="mt-2 text-muted-foreground text-sm leading-6">
						Workspaces keep your OpenClaw agents, projects, and memory policies
						organized.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="px-6 pb-4">
						<Label className="font-medium text-sm" htmlFor="workspace-name">
							Workspace name<span className="text-destructive">*</span>
						</Label>
						<Input
							className="mt-2"
							id="workspace-name"
							name="workspace-name"
							onChange={(event) => setName(event.target.value)}
							placeholder="My workspace"
							required
							type="text"
							value={name}
						/>
						{statusMessage ? (
							<p className="mt-3 text-destructive text-xs">{statusMessage}</p>
						) : null}
						<Button
							className="mt-4 w-full"
							disabled={isSubmitting}
							type="submit"
						>
							{isSubmitting ? "Creating..." : "Create workspace"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
