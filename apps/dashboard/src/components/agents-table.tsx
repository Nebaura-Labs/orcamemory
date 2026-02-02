import { api } from "@moltcity/backend/convex/_generated/api";
import type { Id } from "@moltcity/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
	Bot,
	Brain,
	Circle,
	Copy,
	Eye,
	EyeOff,
	Key,
	MessageSquare,
	MoreHorizontal,
	RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface AgentsTableProps {
	projectId: Id<"projects">;
}

interface Agent {
	_id: Id<"agents">;
	name: string;
	status: "pending" | "connected";
	connected: boolean;
	memoryCount: number;
	sessionCount: number;
	hasActiveKey: boolean;
	keyId: string | null;
	createdAt: number;
	lastSeenAt: number | null;
}

function getKeyDisplayText(
	agentId: string,
	keyId: string | null,
	visibleSecrets: Record<string, { keyId: string; secret: string }>
): string {
	if (visibleSecrets[agentId]) {
		return `${visibleSecrets[agentId].keyId} / ${visibleSecrets[agentId].secret}`;
	}
	if (keyId) {
		return `${keyId}...`;
	}
	return "••••••••";
}

function AgentKeyActions({
	agent,
	visibleSecrets,
	onCopy,
	onToggleVisibility,
}: {
	agent: Agent;
	visibleSecrets: Record<string, { keyId: string; secret: string }>;
	onCopy: (text: string) => void;
	onToggleVisibility: (agentId: string) => void;
}) {
	const visibleData = visibleSecrets[agent._id];

	if (visibleData) {
		return (
			<div className="flex gap-1">
				<Button
					onClick={() => onCopy(`Key ID: ${visibleData.keyId}\nAPI Key: ${visibleData.secret}`)}
					size="icon-sm"
					title="Copy credentials"
					variant="ghost"
				>
					<Copy className="size-3.5" />
				</Button>
				<Button
					onClick={() => onToggleVisibility(agent._id)}
					size="icon-sm"
					title="Hide credentials"
					variant="ghost"
				>
					<EyeOff className="size-3.5" />
				</Button>
			</div>
		);
	}

	if (agent.keyId) {
		return (
			<Button
				onClick={() => onCopy(agent.keyId as string)}
				size="icon-sm"
				title="Copy key ID"
				variant="ghost"
			>
				<Copy className="size-3.5" />
			</Button>
		);
	}

	return null;
}

function AgentRow({
	agent,
	visibleSecrets,
	loading,
	onCopy,
	onToggleVisibility,
	onRotateKey,
}: {
	agent: Agent;
	visibleSecrets: Record<string, { keyId: string; secret: string }>;
	loading: string | null;
	onCopy: (text: string) => void;
	onToggleVisibility: (agentId: string) => void;
	onRotateKey: () => void;
}) {
	return (
		<TableRow>
			<TableCell>
				<div className="flex items-center gap-3">
					<div className="relative flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
						<Bot className="size-4" />
						<Circle
							className={cn(
								"absolute -top-0.5 -right-0.5 size-2.5 fill-current",
								agent.connected ? "text-green-500" : "text-muted-foreground"
							)}
						/>
					</div>
					<div>
						<p className="font-medium">{agent.name}</p>
						<p className="text-muted-foreground text-xs">
							Created{" "}
							{formatDistanceToNow(agent.createdAt, { addSuffix: true })}
						</p>
					</div>
				</div>
			</TableCell>
			<TableCell>
				<Badge
					className={cn(
						agent.connected &&
							"bg-green-500/10 text-green-500 hover:bg-green-500/20"
					)}
					variant={agent.connected ? "default" : "secondary"}
				>
					{agent.connected ? "Connected" : "Pending"}
				</Badge>
			</TableCell>
			<TableCell>
				{agent.hasActiveKey ? (
					<div className="flex items-center gap-2">
						<code className="rounded bg-muted px-2 py-1 font-mono text-xs">
							{getKeyDisplayText(agent._id, agent.keyId, visibleSecrets)}
						</code>
						<AgentKeyActions
							agent={agent}
							onCopy={onCopy}
							onToggleVisibility={onToggleVisibility}
							visibleSecrets={visibleSecrets}
						/>
					</div>
				) : (
					<span className="text-muted-foreground text-sm">No active key</span>
				)}
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-1.5">
					<Brain className="size-4 text-muted-foreground" />
					<span>{agent.memoryCount}</span>
				</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-1.5">
					<MessageSquare className="size-4 text-muted-foreground" />
					<span>{agent.sessionCount}</span>
				</div>
			</TableCell>
			<TableCell>
				<span className="text-muted-foreground text-sm">
					{agent.lastSeenAt
						? formatDistanceToNow(agent.lastSeenAt, { addSuffix: true })
						: "Never"}
				</span>
			</TableCell>
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="icon-sm" variant="ghost">
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							disabled={loading === "rotate"}
							onClick={onRotateKey}
						>
							<RefreshCw className="mr-2 size-4" />
							Rotate API Key
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<a href={`/memories?agent=${agent._id}`}>
								<Eye className="mr-2 size-4" />
								View Memories
							</a>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<Bot className="mb-4 size-12 text-muted-foreground" />
			<p className="mb-2 text-muted-foreground">No agents yet</p>
			<p className="mb-4 max-w-sm text-muted-foreground text-sm">
				Create your first agent to start storing memories. You&apos;ll receive
				an API key to connect your application.
			</p>
		</div>
	);
}

function LoadingState() {
	return <div className="h-64 animate-pulse rounded-none bg-muted/50" />;
}

export function AgentsTable({ projectId }: AgentsTableProps) {
	const agents = useQuery(api.dashboard.listAgentsForProject, { projectId }) as
		| Agent[]
		| undefined;
	const issueKey = useMutation(api.agents.issueKey);
	const [visibleSecrets, setVisibleSecrets] = useState<Record<string, { keyId: string; secret: string }>>(
		{}
	);
	const [loading, setLoading] = useState<string | null>(null);

	const handleIssueKey = async (isRotate: boolean, agentId?: Id<"agents">) => {
		setLoading(isRotate ? "rotate" : "issue");
		try {
			const result = await issueKey({
				projectId,
				rotate: isRotate,
				agentId,
			});
			if (result.secret && result.keyId) {
				setVisibleSecrets((prev) => ({
					...prev,
					[result.agentId]: { keyId: result.keyId as string, secret: result.secret as string },
				}));
				toast.success(isRotate ? "API key rotated successfully" : "Agent created successfully");
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to issue key";
			toast.error(message);
		} finally {
			setLoading(null);
		}
	};

	const handleCopy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Copied to clipboard");
		} catch {
			toast.error("Failed to copy to clipboard");
		}
	};

	const toggleSecretVisibility = (agentId: string) => {
		setVisibleSecrets((prev) => {
			const newState = { ...prev };
			if (newState[agentId]) {
				delete newState[agentId];
			}
			return newState;
		});
	};

	const hasAgents = agents && agents.length > 0;

	const renderContent = () => {
		if (agents === undefined) {
			return <LoadingState />;
		}

		if (agents.length === 0) {
			return <EmptyState />;
		}

		return (
			<>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Agent</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>API Key</TableHead>
							<TableHead>Memories</TableHead>
							<TableHead>Sessions</TableHead>
							<TableHead>Last Active</TableHead>
							<TableHead className="w-[50px]" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{agents.map((agent) => (
							<AgentRow
								agent={agent}
								key={agent._id}
								loading={loading}
								onCopy={handleCopy}
								onRotateKey={() => handleIssueKey(true, agent._id)}
								onToggleVisibility={toggleSecretVisibility}
								visibleSecrets={visibleSecrets}
							/>
						))}
					</TableBody>
				</Table>

				{Object.keys(visibleSecrets).length > 0 && (
					<div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200">
						<strong>Important:</strong> Copy your secret key now. For security,
						it will not be shown again after you leave this page.
					</div>
				)}
			</>
		);
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-4">
				<CardTitle className="text-lg">All Agents</CardTitle>
				{!hasAgents && (
					<Button
						disabled={loading === "issue"}
						onClick={() => handleIssueKey(false)}
						size="sm"
					>
						{loading === "issue" ? (
							<RefreshCw className="mr-2 size-4 animate-spin" />
						) : (
							<Key className="mr-2 size-4" />
						)}
						Create Agent
					</Button>
				)}
			</CardHeader>
			<CardContent className="space-y-4">{renderContent()}</CardContent>
		</Card>
	);
}
