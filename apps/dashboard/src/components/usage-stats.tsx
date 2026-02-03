import { api } from "@moltcity/backend/convex/_generated/api";
import type { Id } from "@moltcity/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Activity, Bot, Coins, Search, TrendingUp, Zap } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface UsageStatsProps {
	projectId: Id<"projects">;
}

interface UsageData {
	plan: "surface" | "tide" | "abyss";
	tokensUsed: number;
	tokensLimit: number;
	searchesUsed: number;
	searchesLimit: number;
	tokensPercent: number;
	searchesPercent: number;
	agentUsage: {
		agentId: string;
		agentName: string;
		tokens: number;
		searches: number;
	}[];
	dailyUsage: {
		date: string;
		tokens: number;
		searches: number;
	}[];
	kindUsage: {
		kind: string;
		tokens: number;
		searches: number;
		count: number;
	}[];
}

function formatNumber(num: number): string {
	if (num >= 1_000_000) {
		return `${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 1000) {
		return `${(num / 1000).toFixed(1)}K`;
	}
	return num.toLocaleString();
}

function formatKind(kind: string): string {
	const mapping: Record<string, string> = {
		add: "Memory Add",
		search: "Memory Search",
		update: "Memory Update",
		delete: "Memory Delete",
		embedding_store: "Store",
		embedding_search: "Search",
	};
	return mapping[kind] ?? kind;
}

function getPlanColor(_plan: string): string {
	return "text-foreground";
}

function UsageCard({
	icon: Icon,
	title,
	used,
	limit,
	percent,
}: {
	icon: typeof Zap;
	title: string;
	used: number;
	limit: number;
	percent: number;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="font-medium text-sm">{title}</CardTitle>
				<Icon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">
					{formatNumber(used)}
					<span className="font-normal text-muted-foreground text-sm">
						{" "}
						/ {formatNumber(limit)}
					</span>
				</div>
				<Progress
					className={cn("mt-3 h-2", percent >= 90 && "[&>div]:bg-red-500")}
					value={percent}
				/>
				<p className="mt-2 text-muted-foreground text-xs">
					{percent.toFixed(1)}% of limit used
				</p>
			</CardContent>
		</Card>
	);
}

function AgentUsageTable({
	agentUsage,
}: {
	agentUsage: UsageData["agentUsage"];
}) {
	if (agentUsage.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<Bot className="mb-2 size-8 text-muted-foreground" />
				<p className="text-muted-foreground text-sm">No agent usage yet</p>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Agent</TableHead>
					<TableHead className="text-right">Tokens</TableHead>
					<TableHead className="text-right">Searches</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{agentUsage.map((agent) => (
					<TableRow key={agent.agentId}>
						<TableCell>
							<div className="flex items-center gap-2">
								<Bot className="size-4 text-muted-foreground" />
								{agent.agentName}
							</div>
						</TableCell>
						<TableCell className="text-right">
							{formatNumber(agent.tokens)}
						</TableCell>
						<TableCell className="text-right">
							{formatNumber(agent.searches)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function KindUsageTable({ kindUsage }: { kindUsage: UsageData["kindUsage"] }) {
	if (kindUsage.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<Activity className="mb-2 size-8 text-muted-foreground" />
				<p className="text-muted-foreground text-sm">No operations yet</p>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Operation</TableHead>
					<TableHead className="text-right">Count</TableHead>
					<TableHead className="text-right">Tokens</TableHead>
					<TableHead className="text-right">Searches</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{kindUsage.map((kind) => (
					<TableRow key={kind.kind}>
						<TableCell>{formatKind(kind.kind)}</TableCell>
						<TableCell className="text-right">
							{formatNumber(kind.count)}
						</TableCell>
						<TableCell className="text-right">
							{formatNumber(kind.tokens)}
						</TableCell>
						<TableCell className="text-right">
							{formatNumber(kind.searches)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function DailyUsageChart({
	dailyUsage,
}: {
	dailyUsage: UsageData["dailyUsage"];
}) {
	if (dailyUsage.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<TrendingUp className="mb-2 size-8 text-muted-foreground" />
				<p className="text-muted-foreground text-sm">No usage data yet</p>
			</div>
		);
	}

	const chartData = dailyUsage.slice(-14).map((day) => ({
		date: day.date.split("-").slice(1).join("/"),
		tokens: day.tokens,
		searches: day.searches,
	}));

	const chartConfig = {
		tokens: {
			label: "Tokens",
			color: "var(--primary)",
		},
		searches: {
			label: "Searches",
			color: "var(--chart-2)",
		},
	} satisfies ChartConfig;

	return (
		<ChartContainer className="h-64 w-full" config={chartConfig}>
			<LineChart data={chartData}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis
					axisLine={false}
					dataKey="date"
					tickLine={false}
					tickMargin={8}
				/>
				<YAxis axisLine={false} tickLine={false} tickMargin={8} width={50} />
				<ChartTooltip content={<ChartTooltipContent />} />
				<Line
					dataKey="tokens"
					dot={false}
					stroke="var(--color-tokens)"
					strokeWidth={2}
					type="monotone"
				/>
				<Line
					dataKey="searches"
					dot={false}
					stroke="var(--color-searches)"
					strokeWidth={2}
					type="monotone"
				/>
			</LineChart>
		</ChartContainer>
	);
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="h-32 animate-pulse rounded-lg bg-card ring-1 ring-foreground/10" />
				<div className="h-32 animate-pulse rounded-lg bg-card ring-1 ring-foreground/10" />
			</div>
			<div className="h-64 animate-pulse rounded-lg bg-card ring-1 ring-foreground/10" />
		</div>
	);
}

export function UsageStats({ projectId }: UsageStatsProps) {
	const usage = useQuery(api.dashboard.getUsageForProject, {
		projectId,
	}) as UsageData | undefined;

	if (usage === undefined) {
		return <LoadingState />;
	}

	return (
		<div className="space-y-6">
			{/* Plan badge */}
			<div className="flex items-center gap-2">
				<Coins className="size-5 text-foreground dark:text-primary" />
				<span className="font-medium capitalize">{usage.plan} Plan</span>
			</div>

			{/* Usage cards */}
			<div className="grid gap-4 md:grid-cols-2">
				<UsageCard
					icon={Zap}
					limit={usage.tokensLimit}
					percent={usage.tokensPercent}
					title="Token Usage"
					used={usage.tokensUsed}
				/>
				<UsageCard
					icon={Search}
					limit={usage.searchesLimit}
					percent={usage.searchesPercent}
					title="Search Usage"
					used={usage.searchesUsed}
				/>
			</div>

			{/* Daily usage chart */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Daily Token Usage</CardTitle>
				</CardHeader>
				<CardContent>
					<DailyUsageChart dailyUsage={usage.dailyUsage} />
				</CardContent>
			</Card>

			{/* Tables */}
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Usage by Agent</CardTitle>
					</CardHeader>
					<CardContent>
						<AgentUsageTable agentUsage={usage.agentUsage} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Usage by Operation</CardTitle>
					</CardHeader>
					<CardContent>
						<KindUsageTable kindUsage={usage.kindUsage} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
