import { api } from "@moltcity/backend/convex/_generated/api";
import type { Id } from "@moltcity/backend/convex/_generated/dataModel";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	ArrowRight,
	Bot,
	Clock,
	FileText,
	Loader2,
	Search,
	Tag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

interface Memory {
	_id: string;
	content: string;
	tags: string[];
	memoryType: string | null;
	metadata: Record<string, unknown> | null;
	agentId: string;
	agentName: string;
	createdAt: number;
}

export const Route = createFileRoute("/memories/search")({
	beforeLoad: ({ context }) => {
		if (!context.isAuthenticated) {
			throw redirect({ to: "/sign-in" });
		}
	},
	component: MemorySearchPage,
});

function MemorySearchPage() {
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
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [agentFilter, setAgentFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Debounce search query
	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => {
			setDebouncedQuery(searchQuery.trim());
		}, 300);
		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [searchQuery]);

	// Redirect to onboarding if no organizations
	useEffect(() => {
		if (isPending) return;
		if (organizations != null && organizations.length === 0) {
			void navigate({ to: "/onboarding" });
		}
	}, [isPending, navigate, organizations]);

	// Set active project from localStorage or first project
	useEffect(() => {
		if (projects?.length && !activeProjectId) {
			const stored = localStorage.getItem(
				"activeProjectId"
			) as Id<"projects"> | null;
			const found = stored ? projects.find((p) => p._id === stored) : null;
			setActiveProjectId(found?._id ?? projects[0]._id);
		}
	}, [projects, activeProjectId]);

	// Fetch agents and memory types for filtering
	const agents = useQuery(
		api.dashboard.getAgentsForProject,
		activeProjectId ? { projectId: activeProjectId } : "skip"
	) as { _id: Id<"agents">; name: string }[] | undefined;

	const memoryTypes = useQuery(
		api.dashboard.getMemoryTypes,
		activeProjectId ? { projectId: activeProjectId } : "skip"
	) as string[] | undefined;

	// Search results - live search with debounce
	const searchResults = useQuery(
		api.dashboard.searchMemories,
		activeProjectId && debouncedQuery
			? {
					projectId: activeProjectId,
					search: debouncedQuery,
					agentId:
						agentFilter !== "all" ? (agentFilter as Id<"agents">) : undefined,
					memoryType: typeFilter !== "all" ? typeFilter : undefined,
					limit: 50,
				}
			: "skip"
	) as
		| { memories: Memory[]; nextCursor: string | null; total: number }
		| undefined;

	const isSearching = searchQuery.trim() !== debouncedQuery;

	const isLoading = isPending || projects === undefined || !activeProjectId;

	return (
		<main className="flex-1 p-6">
			<div className="space-y-6">
				{/* Header */}
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">
						Memory Search
					</h1>
					<p className="text-muted-foreground text-sm">
						Search through your agent's memories using natural language
					</p>
				</div>

				{isLoading ? (
					<div className="h-96 animate-pulse rounded-none bg-card ring-1 ring-foreground/10" />
				) : (
					<div className="space-y-6">
						{/* Search Card */}
						<Card>
							<CardHeader className="pb-4">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Search className="size-5" />
									Search Memories
								</CardTitle>
								<CardDescription>
									Enter a query to search through stored memories. Results are
									ranked by relevance.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="relative">
										<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											className="pr-9 pl-9"
											onChange={(e) => setSearchQuery(e.target.value)}
											placeholder="Start typing to search..."
											value={searchQuery}
										/>
										{isSearching && (
											<Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
										)}
									</div>

									{/* Filters */}
									<div className="flex flex-wrap gap-3">
										<Select
											onValueChange={(v) => setAgentFilter(v ?? "all")}
											value={agentFilter}
										>
											<SelectTrigger className="w-[180px]">
												<Bot className="mr-2 size-4" />
												<SelectValue placeholder="All Agents" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All Agents</SelectItem>
												{agents?.map(
													(agent: { _id: Id<"agents">; name: string }) => (
														<SelectItem key={agent._id} value={agent._id}>
															{agent.name}
														</SelectItem>
													)
												)}
											</SelectContent>
										</Select>

										{memoryTypes && memoryTypes.length > 0 && (
											<Select
												onValueChange={(v) => setTypeFilter(v ?? "all")}
												value={typeFilter}
											>
												<SelectTrigger className="w-[180px]">
													<FileText className="mr-2 size-4" />
													<SelectValue placeholder="All Types" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="all">All Types</SelectItem>
													{memoryTypes.map((type: string) => (
														<SelectItem key={type} value={type}>
															{type}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Results */}
						{debouncedQuery && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="font-medium text-lg">
										Results for "{debouncedQuery}"
									</h2>
									{searchResults && (
										<span className="text-muted-foreground text-sm">
											{searchResults.memories.length}{" "}
											{searchResults.memories.length === 1
												? "result"
												: "results"}
										</span>
									)}
								</div>

								{searchResults === undefined ? (
									<div className="space-y-3">
										{Array.from({ length: 3 }).map((_, i) => (
											<div
												className="h-32 animate-pulse rounded-none bg-card ring-1 ring-foreground/10"
												key={i}
											/>
										))}
									</div>
								) : searchResults.memories.length === 0 ? (
									<Card>
										<CardContent className="flex flex-col items-center justify-center py-12">
											<Search className="mb-4 size-12 text-muted-foreground" />
											<p className="text-center text-muted-foreground">
												No memories found matching "{debouncedQuery}"
											</p>
											<p className="mt-1 text-center text-muted-foreground text-sm">
												Try adjusting your search query or filters
											</p>
										</CardContent>
									</Card>
								) : (
									<div className="space-y-3">
										{searchResults.memories.map((memory: Memory) => (
											<SearchResultCard
												key={memory._id}
												memory={memory}
												searchQuery={debouncedQuery}
											/>
										))}
									</div>
								)}
							</div>
						)}

						{/* Empty State - No search yet */}
						{!debouncedQuery && (
							<Card>
								<CardContent className="flex flex-col items-center justify-center py-16">
									<div className="mb-4 rounded-full bg-muted p-4">
										<Search className="size-8 text-muted-foreground" />
									</div>
									<h3 className="font-medium text-lg">Search Your Memories</h3>
									<p className="mt-1 max-w-md text-center text-muted-foreground text-sm">
										Enter a search query above to find relevant memories stored
										by your agents. You can filter by agent or memory type to
										narrow down results.
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				)}
			</div>
		</main>
	);
}

interface SearchResultCardProps {
	memory: {
		_id: string;
		content: string;
		tags: string[];
		memoryType: string | null;
		metadata: Record<string, unknown> | null;
		agentId: string;
		agentName: string;
		createdAt: number;
	};
	searchQuery: string;
}

function SearchResultCard({ memory, searchQuery }: SearchResultCardProps) {
	// Highlight matching text
	const highlightText = (text: string, query: string) => {
		if (!query.trim()) return text;

		const truncatedStart =
			text.length > 300 ? findBestSnippet(text, query, 300) : text;

		const parts = truncatedStart.split(
			new RegExp(`(${escapeRegex(query)})`, "gi")
		);

		return (
			<>
				{parts.map((part, i) =>
					part.toLowerCase() === query.toLowerCase() ? (
						<mark
							className="rounded-none bg-primary px-0.5 text-primary-foreground"
							key={i}
						>
							{part}
						</mark>
					) : (
						part
					)
				)}
			</>
		);
	};

	return (
		<Card className="transition-colors hover:bg-accent/50">
			<CardContent className="p-4">
				<div className="space-y-3">
					{/* Content with highlighting */}
					<p className="text-sm leading-relaxed">
						{highlightText(memory.content, searchQuery)}
					</p>

					{/* Meta info */}
					<div className="flex items-center justify-between gap-3 text-xs">
						<div className="flex items-center gap-3">
							<span className="flex items-center gap-1 text-muted-foreground">
								<Bot className="size-3" />
								{memory.agentName}
							</span>

							{memory.memoryType && (
								<Badge className="text-xs" variant="secondary">
									{memory.memoryType}
								</Badge>
							)}

							<span className="flex items-center gap-1 text-muted-foreground">
								<Clock className="size-3" />
								{new Date(memory.createdAt).toLocaleDateString()}
							</span>

							{memory.tags.length > 0 && (
								<span className="flex items-center gap-1 text-muted-foreground">
									<Tag className="size-3" />
									{memory.tags.slice(0, 3).join(", ")}
									{memory.tags.length > 3 && ` +${memory.tags.length - 3}`}
								</span>
							)}
						</div>

						{/* View Details Button */}
						<a href={`/memories/${memory._id}`}>
							<Button size="sm">
								View
								<ArrowRight className="ml-1 size-3" />
							</Button>
						</a>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function escapeRegex(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findBestSnippet(
	text: string,
	query: string,
	maxLength: number
): string {
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const matchIndex = lowerText.indexOf(lowerQuery);

	if (matchIndex === -1) {
		// No match found, just return truncated text
		return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
	}

	// Center the snippet around the match
	const contextBefore = 50;
	const start = Math.max(0, matchIndex - contextBefore);
	const end = Math.min(text.length, start + maxLength);

	let snippet = text.slice(start, end);

	if (start > 0) {
		snippet = `...${snippet}`;
	}
	if (end < text.length) {
		snippet = `${snippet}...`;
	}

	return snippet;
}
