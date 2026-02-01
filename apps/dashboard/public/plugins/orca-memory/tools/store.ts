import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { OrcaMemoryClient } from "../client.ts";
import { detectMemoryType } from "../memory.ts";
import { log } from "../logger.ts";

export function registerStoreTool(
  api: OpenClawPluginApi,
  client: OrcaMemoryClient,
  getSession: () => { sessionId: string | null; sessionName?: string },
): void {
  api.registerTool(
    {
      name: "orca_memory_store",
      label: "Memory Store",
      description: "Save important information in long-term memory.",
      parameters: Type.Object({
        content: Type.String({ description: "Information to remember" }),
        memoryType: Type.Optional(Type.String()),
        tags: Type.Optional(Type.Array(Type.String())),
      }),
      async execute(
        _toolCallId: string,
        params: { content: string; memoryType?: string; tags?: string[] },
      ) {
        const memoryType = params.memoryType ?? detectMemoryType(params.content);
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
    { name: "orca_memory_store" },
  );
}
