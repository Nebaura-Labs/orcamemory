"use client";

import { formatDistanceToNow } from "date-fns";
import { Bot, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Agent = {
	_id: string;
	name: string;
	connected: boolean;
	memoryCount: number;
	lastActive: number | null;
};

interface AgentStatusProps {
	agents: Agent[];
}

export function AgentStatus({ agents }: AgentStatusProps) {
	if (agents.length === 0) {
		return (
			<Card className="border-dashed">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Bot className="dark-icon size-4" />
						Agents
					</CardTitle>
					<CardDescription>Your connected agents</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
						No agents connected yet
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-dashed">
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="flex items-center gap-2 text-base">
						<Bot className="dark-icon size-4" />
						Agents
					</CardTitle>
					<CardDescription>Your connected agents</CardDescription>
				</div>
				<Button asChild className="border-dashed" size="sm" variant="outline">
					<a href="/agents">View all</a>
				</Button>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3 sm:grid-cols-2">
					{agents.map((agent) => (
						<div
							className="flex items-center gap-3 rounded-md border border-dashed p-3"
							key={agent._id}
						>
							<div className="relative flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
								<Bot className="size-4" />
								<Circle
									className={cn(
										"absolute -top-0.5 -right-0.5 size-2.5 fill-current",
										agent.connected ? "text-green-500" : "text-muted-foreground"
									)}
								/>
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-sm">{agent.name}</p>
								<p className="text-muted-foreground text-xs">
									{agent.memoryCount} memories
									{agent.lastActive && (
										<span>
											{" • "}
											{formatDistanceToNow(agent.lastActive, {
												addSuffix: true,
											})}
										</span>
									)}
								</p>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
