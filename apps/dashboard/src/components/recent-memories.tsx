"use client";

import { formatDistanceToNow } from "date-fns";
import { Brain, FileText, Heart, Lightbulb, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

type Memory = {
	_id: string;
	content: string;
	type: string;
	agentName: string;
	createdAt: number;
};

const typeIcons: Record<string, React.ElementType> = {
	conversation: MessageSquare,
	decision: Lightbulb,
	preference: Heart,
	fact: FileText,
};

const typeColors: Record<string, string> = {
	conversation: "bg-blue-500/10 text-blue-500",
	decision: "bg-amber-500/10 text-amber-500",
	preference: "bg-pink-500/10 text-pink-500",
	fact: "bg-green-500/10 text-green-500",
};

interface RecentMemoriesProps {
	memories: Memory[];
}

export function RecentMemories({ memories }: RecentMemoriesProps) {
	if (memories.length === 0) {
		return (
			<Card className="border-dashed">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Brain className="dark-icon size-4" />
						Recent Memories
					</CardTitle>
					<CardDescription>Latest memories from your agents</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
						No memories stored yet
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
						<Brain className="dark-icon size-4" />
						Recent Memories
					</CardTitle>
					<CardDescription>Latest memories from your agents</CardDescription>
				</div>
				<Button asChild className="border-dashed" size="sm" variant="outline">
					<a href="/memories">View all</a>
				</Button>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{memories.map((memory) => {
						const Icon = typeIcons[memory.type] ?? FileText;
						const colorClass =
							typeColors[memory.type] ?? "bg-muted text-muted-foreground";

						return (
							<div
								className="flex items-start gap-3 rounded-md border border-dashed p-3"
								key={memory._id}
							>
								<div className={`rounded-md p-1.5 ${colorClass}`}>
									<Icon className="size-3.5" />
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm">{memory.content}</p>
									<div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
										<span>{memory.agentName}</span>
										<span>•</span>
										<span>
											{formatDistanceToNow(memory.createdAt, {
												addSuffix: true,
											})}
										</span>
									</div>
								</div>
								<Badge
									className="shrink-0 border-dashed text-xs"
									variant="outline"
								>
									{memory.type}
								</Badge>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
