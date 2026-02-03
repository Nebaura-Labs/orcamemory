import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { OrcaMemoryClient } from "../client.ts";
import { log } from "../logger.ts";
import { detectMemoryType } from "../memory.ts";

export function registerStoreTool(
	api: OpenClawPluginApi,
	client: OrcaMemoryClient,
	getSession: () => { sessionId: string | null; sessionName?: string }
): void {
	api.registerTool(
		{
			name: "orca_memory_store",
			label: "Memory Store",
			description:
				"Conversations are auto-captured automatically. Use this tool to manually store important information with proper categorization. Choose memoryType based on content: 'preferences' for user likes/dislikes/wants, 'decisions' for choices and commitments made, 'facts' for identities/contact info/names, 'conversations' for general context. Write clean, searchable content rather than raw conversation text.",
			parameters: Type.Object({
				content: Type.String({ description: "Information to remember" }),
				memoryType: Type.Optional(Type.String()),
				tags: Type.Optional(Type.Array(Type.String())),
			}),
			async execute(
				_toolCallId: string,
				params: { content: string; memoryType?: string; tags?: string[] }
			) {
				const memoryType =
					params.memoryType ?? detectMemoryType(params.content);
				const session = getSession();
				log.debug(`store tool: ${params.content.slice(0, 60)}`);

				const result = await client.store({
					content: params.content,
					memoryType,
					tags: params.tags ?? [],
					sessionId: session.sessionId ?? undefined,
					sessionName: session.sessionName,
				});

				return {
					content: [
						{ type: "text" as const, text: `Stored memory (${memoryType}).` },
					],
					details: { action: "created", id: result.id },
				};
			},
		},
		{ name: "orca_memory_store" }
	);
}
