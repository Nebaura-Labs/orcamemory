"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// Lazy load the graph component to avoid SSR issues
const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphRef = any;

interface MemoryNode {
	id: string;
	content: string;
	agentId: string;
	agentName: string;
	sessionId: string | null;
	tags: string[];
	memoryType: string | null;
	createdAt: number;
}

interface Agent {
	id: string;
	name: string;
	color: string;
}

interface Session {
	id: string;
	name: string;
	agentId: string;
}

interface MemoryNetworkGraphProps {
	nodes: MemoryNode[];
	agents: Agent[];
	sessions: Session[];
	retentionDays?: number | null;
	className?: string;
}

interface GraphNode {
	id: string;
	x?: number;
	y?: number;
	data: MemoryNode;
	color: string;
	isRecent: boolean;
	isExpiringSoon: boolean;
	nodeType: "memory";
}

interface GraphLink {
	source: string | GraphNode;
	target: string | GraphNode;
	type: "session" | "tag" | "agent";
	strength: number;
}

const AGENT_COLORS = [
	"#22c55e", // green
	"#3b82f6", // blue
	"#a855f7", // purple
	"#f59e0b", // amber
	"#ef4444", // red
	"#ec4899", // pink
	"#06b6d4", // cyan
	"#f97316", // orange
];

const LINK_COLORS = {
	session: "rgba(34, 197, 94, 0.4)", // green
	tag: "rgba(168, 85, 247, 0.3)", // purple
	agent: "rgba(59, 130, 246, 0.2)", // blue
};

const EXPIRING_SOON_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function MemoryNetworkGraph({
	nodes,
	agents,
	sessions: _sessions,
	retentionDays,
	className,
}: MemoryNetworkGraphProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const graphRef = useRef<GraphRef>(undefined);
	const [dimensions, setDimensions] = useState({ width: 0, height: 500 });
	const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Handle resize
	useEffect(() => {
		if (!containerRef.current || !mounted) return;

		const updateDimensions = () => {
			if (containerRef.current) {
				// Use offsetWidth for accurate measurement
				const width = containerRef.current.offsetWidth;
				setDimensions({
					width: Math.max(width, 100),
					height: 500,
				});
			}
		};

		// Small delay to ensure layout is complete
		const timer = setTimeout(updateDimensions, 50);

		const resizeObserver = new ResizeObserver(updateDimensions);
		resizeObserver.observe(containerRef.current);

		return () => {
			clearTimeout(timer);
			resizeObserver.disconnect();
		};
	}, [mounted]);

	// Create agent color map
	const agentColorMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const [i, agent] of agents.entries()) {
			map.set(agent.id, agent.color || AGENT_COLORS[i % AGENT_COLORS.length]);
		}
		return map;
	}, [agents]);

	// Find most recent timestamp
	const recentThreshold = useMemo(() => {
		if (nodes.length === 0) return 0;
		const maxTimestamp = Math.max(...nodes.map((n) => n.createdAt));
		return maxTimestamp - MS_PER_DAY;
	}, [nodes]);

	// Calculate expiration threshold
	const expirationThreshold = useMemo(() => {
		if (!mounted || !retentionDays) return null;
		const now = Date.now();
		return now - (retentionDays - EXPIRING_SOON_DAYS) * MS_PER_DAY;
	}, [mounted, retentionDays]);

	// Build graph data
	const graphData = useMemo(() => {
		if (nodes.length === 0) return { nodes: [], links: [] };

		const graphNodes: GraphNode[] = nodes.map((node) => {
			const isExpiringSoon = expirationThreshold
				? node.createdAt < expirationThreshold
				: false;
			return {
				id: node.id,
				data: node,
				color: agentColorMap.get(node.agentId) || "#6b7280",
				isRecent: node.createdAt > recentThreshold,
				isExpiringSoon,
				nodeType: "memory" as const,
			};
		});

		const links: GraphLink[] = [];
		const nodeIds = new Set(nodes.map((n) => n.id));

		// Group by session
		const sessionGroups = new Map<string, MemoryNode[]>();
		for (const node of nodes) {
			if (node.sessionId) {
				const group = sessionGroups.get(node.sessionId) || [];
				group.push(node);
				sessionGroups.set(node.sessionId, group);
			}
		}

		// Connect nodes in same session
		for (const [_sessionId, sessionNodes] of sessionGroups) {
			for (let i = 0; i < sessionNodes.length - 1; i++) {
				if (
					nodeIds.has(sessionNodes[i].id) &&
					nodeIds.has(sessionNodes[i + 1].id)
				) {
					links.push({
						source: sessionNodes[i].id,
						target: sessionNodes[i + 1].id,
						type: "session",
						strength: 0.8,
					});
				}
			}
		}

		// Connect nodes with shared tags (limit to avoid clutter)
		const tagCount = new Map<string, string[]>();
		for (const node of nodes) {
			for (const tag of node.tags) {
				const existing = tagCount.get(tag) || [];
				existing.push(node.id);
				tagCount.set(tag, existing);
			}
		}

		for (const [_tag, nodeIdsWithTag] of tagCount) {
			if (nodeIdsWithTag.length >= 2 && nodeIdsWithTag.length <= 10) {
				// Only connect first pair to avoid too many links
				links.push({
					source: nodeIdsWithTag[0],
					target: nodeIdsWithTag[1],
					type: "tag",
					strength: 0.3,
				});
			}
		}

		return { nodes: graphNodes, links };
	}, [nodes, agentColorMap, recentThreshold, expirationThreshold]);

	// Custom node rendering
	const paintNode = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
			const graphNode = node as GraphNode;
			const x = graphNode.x ?? 0;
			const y = graphNode.y ?? 0;
			const size = graphNode.isRecent || graphNode.isExpiringSoon ? 6 : 4;
			const scaledSize = size / Math.sqrt(globalScale);

			// Glow effect for recent/expiring nodes
			if (graphNode.isExpiringSoon) {
				ctx.beginPath();
				ctx.arc(x, y, scaledSize + 4, 0, 2 * Math.PI);
				ctx.fillStyle = "rgba(245, 158, 11, 0.3)";
				ctx.fill();
			} else if (graphNode.isRecent) {
				ctx.beginPath();
				ctx.arc(x, y, scaledSize + 4, 0, 2 * Math.PI);
				ctx.fillStyle = `${graphNode.color}33`;
				ctx.fill();
			}

			// Main node
			ctx.beginPath();
			ctx.arc(x, y, scaledSize, 0, 2 * Math.PI);
			ctx.fillStyle = graphNode.isExpiringSoon ? "#f59e0b" : graphNode.color;
			ctx.fill();

			// Border for hovered/recent
			if (hoveredNode?.id === graphNode.id || graphNode.isRecent) {
				ctx.strokeStyle = graphNode.isExpiringSoon
					? "#fbbf24"
					: graphNode.isRecent
						? "#ffffff"
						: graphNode.color;
				ctx.lineWidth = 1.5 / globalScale;
				ctx.stroke();
			}
		},
		[hoveredNode]
	);

	// Custom link rendering
	const paintLink = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(link: any, ctx: CanvasRenderingContext2D, _globalScale: number) => {
			const graphLink = link as GraphLink;
			const source = graphLink.source as GraphNode;
			const target = graphLink.target as GraphNode;

			if (!source.x || !source.y || !target.x || !target.y) return;

			ctx.beginPath();
			ctx.moveTo(source.x, source.y);
			ctx.lineTo(target.x, target.y);
			ctx.strokeStyle = LINK_COLORS[graphLink.type];
			ctx.lineWidth = graphLink.type === "session" ? 1.5 : 0.8;

			if (graphLink.type === "tag") {
				ctx.setLineDash([3, 3]);
			} else {
				ctx.setLineDash([]);
			}

			ctx.stroke();
			ctx.setLineDash([]);
		},
		[]
	);

	// Handle node hover
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleNodeHover = useCallback((node: any) => {
		setHoveredNode(node as GraphNode | null);
	}, []);

	// Zoom to fit on mount
	useEffect(() => {
		if (graphRef.current && graphData.nodes.length > 0 && mounted) {
			setTimeout(() => {
				graphRef.current?.zoomToFit(400, 50);
			}, 500);
		}
	}, [graphData.nodes.length, mounted]);

	// Empty state
	if (nodes.length === 0) {
		return (
			<div
				className={cn("flex h-[500px] items-center justify-center", className)}
				ref={containerRef}
			>
				<p className="text-muted-foreground">No memories to display</p>
			</div>
		);
	}

	if (!mounted || dimensions.width === 0) {
		return (
			<div
				className={cn("flex h-[500px] w-full items-center justify-center", className)}
				ref={containerRef}
			>
				<p className="text-muted-foreground">Loading graph...</p>
			</div>
		);
	}

	return (
		<div className={cn("relative w-full min-w-0 overflow-hidden", className)} ref={containerRef}>
			<div
				className="w-full overflow-hidden rounded-lg border border-dashed bg-background/50"
				style={{ height: 500 }}
			>
				<Suspense
					fallback={
						<div className="flex h-[500px] items-center justify-center">
							<p className="text-muted-foreground">Loading graph...</p>
						</div>
					}
				>
					<ForceGraph2D
						ref={graphRef}
						graphData={graphData}
						width={dimensions.width}
						height={500}
						backgroundColor="transparent"
						nodeCanvasObject={paintNode}
						nodePointerAreaPaint={(node, color, ctx) => {
							const size = 8;
							ctx.fillStyle = color;
							ctx.beginPath();
							ctx.arc(node.x ?? 0, node.y ?? 0, size, 0, 2 * Math.PI);
							ctx.fill();
						}}
						linkCanvasObject={paintLink}
						onNodeHover={handleNodeHover}
						cooldownTicks={100}
						d3AlphaDecay={0.02}
						d3VelocityDecay={0.3}
						enableZoomInteraction={true}
						enablePanInteraction={true}
					/>
				</Suspense>
			</div>

			{/* Tooltip */}
			{hoveredNode && (
				<div className="bg-popover text-popover-foreground pointer-events-none absolute left-4 top-4 z-50 max-w-xs rounded-lg border p-3 shadow-lg">
					<div className="mb-1 flex items-center gap-2">
						<div
							className="size-2.5 rounded-full"
							style={{ backgroundColor: hoveredNode.color }}
						/>
						<p className="text-sm font-medium">{hoveredNode.data.agentName}</p>
					</div>
					<p className="text-muted-foreground mb-2 line-clamp-3 text-xs">
						{hoveredNode.data.content}
					</p>
					{hoveredNode.data.tags.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{hoveredNode.data.tags.slice(0, 5).map((tag) => (
								<span
									key={tag}
									className="bg-muted rounded px-1.5 py-0.5 text-xs"
								>
									{tag}
								</span>
							))}
							{hoveredNode.data.tags.length > 5 && (
								<span className="text-muted-foreground text-xs">
									+{hoveredNode.data.tags.length - 5}
								</span>
							)}
						</div>
					)}
					{hoveredNode.isRecent && !hoveredNode.isExpiringSoon && (
						<p className="mt-1 text-xs text-green-500">✦ New memory</p>
					)}
					{hoveredNode.isExpiringSoon && (
						<p className="mt-1 text-xs text-amber-500">⚠ Expiring soon</p>
					)}
				</div>
			)}

			{/* Legend */}
			<div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-lg border bg-background/80 p-3 text-xs backdrop-blur-sm">
				<div className="flex items-center gap-2">
					<div className="h-0.5 w-4 bg-green-500/60" />
					<span className="text-muted-foreground">Session link</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="h-0.5 w-4 border-t border-dashed border-purple-500/60" />
					<span className="text-muted-foreground">Tag link</span>
				</div>
				<div className="mt-1 flex items-center gap-2">
					<div className="size-2 rounded-full bg-amber-500" />
					<span className="text-muted-foreground">Expiring soon</span>
				</div>
			</div>
		</div>
	);
}
