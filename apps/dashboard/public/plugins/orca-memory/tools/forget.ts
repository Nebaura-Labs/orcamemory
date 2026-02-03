import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { OrcaMemoryClient } from "../client.ts";
import { log } from "../logger.ts";

export function registerForgetTool(
	api: OpenClawPluginApi,
	client: OrcaMemoryClient
): void {
	api.registerTool(
		{
			name: "orca_memory_forget",
			label: "Memory Forget",
			description: "Delete specific memories by id.",
			parameters: Type.Object({
				ids: Type.Array(Type.String({ description: "Memory IDs to delete" })),
			}),
			async execute(_toolCallId: string, params: { ids: string[] }) {
				if (!params.ids || params.ids.length === 0) {
					return {
						content: [
							{ type: "text" as const, text: "No memory IDs provided." },
						],
					};
				}

				log.debug(`forget tool: ${params.ids.length} memories`);
				const result = await client.forget(params.ids);
				return {
					content: [
						{
							type: "text" as const,
							text: `Deleted ${result.deleted} memories.`,
						},
					],
				};
			},
		},
		{ name: "orca_memory_forget" }
	);
}
