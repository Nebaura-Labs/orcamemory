import { api } from "@moltcity/backend/convex/_generated/api";
import type { Id } from "@moltcity/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
	Bot,
	Brain,
	Circle,
	Clock,
	Eye,
	Hash,
	MessageSquare,
	MoreHorizontal,
	Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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

interface SessionsTableProps {
	projectId: Id<"projects">;
}

interface Session {
	_id: Id<"sessions">;
	name: string;
	model: string | null;
	agentId: Id<"agents">;
	agentName: string;
	eventCount: number;
	memoryCount: number;
	totalTokens: number;
	startedAt: number;
	lastActivityAt: number;
	endedAt: number | null;
	isActive: boolean;
}

function formatTokens(tokens: number): string {
	if (tokens >= 1_000_000) {
		return `${(tokens / 1_000_000).toFixed(1)}M`;
	}
	if (tokens >= 1000) {
		return `${(tokens / 1000).toFixed(1)}K`;
	}
	return tokens.toString();
}

function SessionRow({ session }: { session: Session }) {
	return (
		<TableRow>
			<TableCell>
				<div className="flex items-center gap-3">
					<div className="relative flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
						<MessageSquare className="size-4" />
						<Circle
							className={cn(
								"absolute -top-0.5 -right-0.5 size-2.5 fill-current",
								session.isActive ? "text-green-500" : "text-muted-foreground"
							)}
						/>
					</div>
					<div>
						<p className="font-medium">{session.name}</p>
						{session.model && (
							<p className="text-muted-foreground text-xs">{session.model}</p>
						)}
					</div>
				</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-1.5">
					<Bot className="size-4 text-muted-foreground" />
					<span className="text-sm">{session.agentName}</span>
				</div>
			</TableCell>
			<TableCell>
				<Badge
					className={cn(
						session.isActive &&
							"bg-green-500/10 text-green-500 hover:bg-green-500/20"
					)}
					variant={session.isActive ? "default" : "secondary"}
				>
					{session.isActive ? "Active" : "Ended"}
				</Badge>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-1.5">
					<Hash className="size-4 text-muted-foreground" />
					<span>{session.eventCount}</span>
				</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-1.5">
					<Brain className="size-4 text-muted-foreground" />
					<span>{session.memoryCount}</span>
				</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-1.5">
					<Zap className="size-4 text-muted-foreground" />
					<span>{formatTokens(session.totalTokens)}</span>
				</div>
			</TableCell>
			<TableCell>
				<div className="flex items-center gap-1.5">
					<Clock className="size-4 text-muted-foreground" />
					<span className="text-muted-foreground text-sm">
						{formatDistanceToNow(session.lastActivityAt, { addSuffix: true })}
					</span>
				</div>
			</TableCell>
			<TableCell>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="icon-sm" variant="ghost">
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<a href={`/memories?session=${session._id}`}>
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
			<MessageSquare className="mb-4 size-12 text-muted-foreground" />
			<p className="mb-2 text-muted-foreground">No sessions yet</p>
			<p className="mb-4 max-w-sm text-muted-foreground text-sm">
				Sessions are created when your agents start conversations. Connect an
				agent to begin tracking sessions.
			</p>
		</div>
	);
}

function LoadingState() {
	return <div className="h-64 animate-pulse rounded-none bg-muted/50" />;
}

export function SessionsTable({ projectId }: SessionsTableProps) {
	const sessions = useQuery(api.dashboard.listSessionsForProject, {
		projectId,
	}) as Session[] | undefined;

	const renderContent = () => {
		if (sessions === undefined) {
			return <LoadingState />;
		}

		if (sessions.length === 0) {
			return <EmptyState />;
		}

		return (
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Session</TableHead>
						<TableHead>Agent</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Events</TableHead>
						<TableHead>Memories</TableHead>
						<TableHead>Tokens</TableHead>
						<TableHead>Last Activity</TableHead>
						<TableHead className="w-[50px]" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{sessions.map((session) => (
						<SessionRow key={session._id} session={session} />
					))}
				</TableBody>
			</Table>
		);
	};

	return (
		<Card>
			<CardHeader className="pb-4">
				<CardTitle className="text-lg">Session History</CardTitle>
			</CardHeader>
			<CardContent>{renderContent()}</CardContent>
		</Card>
	);
}
