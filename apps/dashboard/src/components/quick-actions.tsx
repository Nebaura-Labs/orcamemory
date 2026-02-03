"use client";

import { Key, Plus, Search, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const actions = [
	{
		label: "Search memories",
		description: "Find memories across all agents",
		icon: Search,
		href: "/memories/search",
	},
	{
		label: "Add agent",
		description: "Connect a new OpenClaw agent",
		icon: Plus,
		href: "/agents/new",
	},
	{
		label: "API keys",
		description: "Manage your API credentials",
		icon: Key,
		href: "/settings/api-keys",
	},
	{
		label: "Settings",
		description: "Configure retention & policies",
		icon: Settings,
		href: "/settings",
	},
];

export function QuickActions() {
	return (
		<Card className="border-dashed">
			<CardHeader>
				<CardTitle className="text-base">Quick Actions</CardTitle>
				<CardDescription>Common tasks and shortcuts</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-2 sm:grid-cols-2">
					{actions.map((action) => (
						<Button
							asChild
							className="h-auto justify-start gap-3 border-dashed px-3 py-3"
							key={action.href}
							variant="outline"
						>
							<a href={action.href}>
								<action.icon className="dark-icon size-4 shrink-0" />
								<div className="text-left">
									<p className="font-medium text-sm">{action.label}</p>
									<p className="text-muted-foreground text-xs">
										{action.description}
									</p>
								</div>
							</a>
						</Button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
