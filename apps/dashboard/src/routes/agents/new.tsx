import { api } from "@moltcity/backend/convex/_generated/api";
import type { Id } from "@moltcity/backend/convex/_generated/dataModel";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Bot, Copy, Key } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/agents/new")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: CreateAgentPage,
});

interface CreatedAgent {
	agentId: string;
	keyId: string;
	secret: string | null;
}

function SuccessView({
	agentName,
	createdAgent,
	onCopy,
	onNavigate,
}: {
	agentName: string;
	createdAgent: CreatedAgent;
	onCopy: (text: string, label: string) => void;
	onNavigate: () => void;
}) {
	return (
		<main className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center p-6">
			<div className="w-full max-w-xl space-y-6">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						Agent Created
					</h1>
					<p className="text-muted-foreground text-sm">
						Save your API credentials - the secret won&apos;t be shown again
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Bot className="size-5" />
							{agentName || "Orca Agent"}
						</CardTitle>
						<CardDescription>
							Use these credentials to connect your agent
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label className="font-medium text-sm">Key ID</Label>
							<div className="flex items-center gap-2">
								<code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
									{createdAgent.keyId}
								</code>
								<Button
									onClick={() => onCopy(createdAgent.keyId, "Key ID")}
									size="icon"
									variant="outline"
								>
									<Copy className="size-4" />
								</Button>
							</div>
						</div>

						{createdAgent.secret && (
							<div className="space-y-2">
								<Label className="font-medium text-sm">Secret</Label>
								<div className="flex items-center gap-2">
									<code className="flex-1 overflow-x-auto rounded bg-muted px-3 py-2 font-mono text-sm">
										{createdAgent.secret}
									</code>
									<Button
										onClick={() =>
											onCopy(createdAgent.secret as string, "Secret")
										}
										size="icon"
										variant="outline"
									>
										<Copy className="size-4" />
									</Button>
								</div>
							</div>
						)}

						<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200">
							<strong>Important:</strong> Copy your secret key now. For
							security, it will not be shown again.
						</div>

						<Button className="w-full" onClick={onNavigate}>
							Go to Agents
						</Button>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

function CreateAgentForm({
	agentName,
	isSubmitting,
	onAgentNameChange,
	onSubmit,
}: {
	agentName: string;
	isSubmitting: boolean;
	onAgentNameChange: (name: string) => void;
	onSubmit: (e: FormEvent) => void;
}) {
	return (
		<main className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center p-6">
			<div className="w-full max-w-xl space-y-6">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						Create Agent
					</h1>
					<p className="text-muted-foreground text-sm">
						Create a new agent and get API credentials to connect it
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Key className="size-5" />
							New Agent
						</CardTitle>
						<CardDescription>
							Enter a name for your agent. You&apos;ll receive API credentials
							after creation.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={onSubmit}>
							<div className="space-y-2">
								<Label htmlFor="agent-name">Agent Name</Label>
								<Input
									id="agent-name"
									onChange={(e) => onAgentNameChange(e.target.value)}
									placeholder="My Agent"
									value={agentName}
								/>
								<p className="text-muted-foreground text-xs">
									Leave blank to use the default name &quot;Orca Agent&quot;
								</p>
							</div>

							<Button className="w-full" disabled={isSubmitting} type="submit">
								{isSubmitting ? "Creating..." : "Create Agent"}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

function LoadingState() {
	return (
		<main className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center p-6">
			<div className="h-96 w-full max-w-xl animate-pulse rounded-lg bg-card ring-1 ring-foreground/10" />
		</main>
	);
}

function LimitReachedView({
	current,
	limit,
	plan,
}: {
	current: number;
	limit: number;
	plan: string;
}) {
	return (
		<main className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center p-6">
			<div className="w-full max-w-xl space-y-6">
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						Agent Limit Reached
					</h1>
					<p className="text-muted-foreground text-sm">
						You&apos;ve reached the maximum number of agents for your plan
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<AlertTriangle className="size-5 text-amber-500" />
							Upgrade Required
						</CardTitle>
						<CardDescription>
							Your {plan} plan allows up to {limit} agent
							{limit !== 1 ? "s" : ""} per project. You currently have {current}
							.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="rounded-md border bg-muted/50 p-4">
							<p className="text-sm">
								To create more agents, upgrade your plan to get higher limits
								and additional features.
							</p>
						</div>

						<div className="flex gap-3">
							<Button asChild className="flex-1">
								<Link to="/plan">View Plans</Link>
							</Button>
							<Button asChild className="flex-1" variant="outline">
								<Link to="/agents">Back to Agents</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

function CreateAgentPage() {
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
	const [agentName, setAgentName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [createdAgent, setCreatedAgent] = useState<CreatedAgent | null>(null);

	const issueKey = useMutation(api.agents.issueKey);

	const agentLimits = useQuery(
		api.plans.getAgentLimits,
		activeProjectId ? { projectId: activeProjectId } : "skip"
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

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!activeProjectId) {
			return;
		}

		setIsSubmitting(true);
		try {
			const result = await issueKey({
				projectId: activeProjectId,
				name: agentName.trim() || undefined,
			});

			if (result.secret) {
				setCreatedAgent({
					agentId: result.agentId,
					keyId: result.keyId,
					secret: result.secret,
				});
				toast.success("Agent created successfully");
			} else {
				toast.error("Agent created but no secret was returned");
				navigate({ to: "/agents" });
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to create agent";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	const isLoading =
		isPending ||
		projects === undefined ||
		!activeProjectId ||
		agentLimits === undefined;

	if (isLoading) {
		return <LoadingState />;
	}

	if (createdAgent) {
		return (
			<SuccessView
				agentName={agentName}
				createdAgent={createdAgent}
				onCopy={handleCopy}
				onNavigate={() => navigate({ to: "/agents" })}
			/>
		);
	}

	if (!agentLimits.canCreate) {
		return (
			<LimitReachedView
				current={agentLimits.current}
				limit={agentLimits.limit}
				plan={agentLimits.plan}
			/>
		);
	}

	return (
		<CreateAgentForm
			agentName={agentName}
			isSubmitting={isSubmitting}
			onAgentNameChange={setAgentName}
			onSubmit={handleSubmit}
		/>
	);
}
