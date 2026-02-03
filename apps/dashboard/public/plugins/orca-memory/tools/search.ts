import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { OrcaMemoryClient } from "../client.ts";
import type { OrcaMemoryConfig } from "../config.ts";
import { log } from "../logger.ts";

export function registerSearchTool(
	api: OpenClawPluginApi,
	client: OrcaMemoryClient,
	cfg: OrcaMemoryConfig
): void {
	api.registerTool(
		{
			name: "orca_memory_search",
			label: "Memory Search",
			description:
				"Search through long-term memories for relevant information.",
			parameters: Type.Object({
				query: Type.String({ description: "Search query" }),
				limit: Type.Optional(
					Type.Number({ description: "Max results (default: 10)" })
				),
			}),
			async execute(
				_toolCallId: string,
				params: { query: string; limit?: number }
			) {
				const limit = params.limit ?? cfg.maxRecallResults;
				log.debug(`search tool: query="${params.query}" limit=${limit}`);

				const results = await client.search(params.query, limit);

				if (results.length === 0) {
					return {
						content: [
							{ type: "text" as const, text: "No relevant memories found." },
						],
					};
				}

				const text = results
					.map((r, i) => {
						const type = r.memoryType ? `[${r.memoryType}] ` : "";
						return `${i + 1}. ${type}${r.content}`;
					})
					.join("\n");

				return {
					content: [
						{
							type: "text" as const,
							text: `Found ${results.length} memories:\n\n${text}`,
						},
					],
					details: {
						count: results.length,
						memories: results.map((r) => ({
							id: r.id,
							content: r.content,
							memoryType: r.memoryType,
						})),
					},
				};
			},
		},
		{ name: "orca_memory_search" }
	);
}
