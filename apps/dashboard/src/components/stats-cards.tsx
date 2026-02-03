import { Bot, Brain, History, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatsCardsProps {
	totalMemories: number;
	totalAgents: number;
	sessionCount: number;
	tokenUsage: number;
	tokenLimit: number;
}

export function StatsCards({
	totalMemories,
	totalAgents,
	sessionCount,
	tokenUsage,
	tokenLimit,
}: StatsCardsProps) {
	const tokenPercentage = Math.min((tokenUsage / tokenLimit) * 100, 100);

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Memories</CardTitle>
					<Brain className="dark-icon size-4" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{totalMemories.toLocaleString()}
					</div>
					<p className="text-muted-foreground text-xs">
						Stored in your workspace
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Agents</CardTitle>
					<Bot className="dark-icon size-4" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{totalAgents}</div>
					<p className="text-muted-foreground text-xs">
						Active agents connected
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">
						Total Agent Sessions
					</CardTitle>
					<History className="dark-icon size-4" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{sessionCount}</div>
					<p className="text-muted-foreground text-xs">Across all agents</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Token Usage</CardTitle>
					<Zap className="dark-icon size-4" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">
						{tokenUsage.toLocaleString()}
					</div>
					<Progress className="mt-2" value={tokenPercentage} />
					<p className="mt-1 text-muted-foreground text-xs">
						{tokenPercentage.toFixed(0)}% of {tokenLimit.toLocaleString()} limit
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
