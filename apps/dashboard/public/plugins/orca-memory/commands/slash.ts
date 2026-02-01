import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { OrcaMemoryClient } from "../client.ts";
import { detectMemoryType } from "../memory.ts";
import { log } from "../logger.ts";

export function registerCommands(
  api: OpenClawPluginApi,
  client: OrcaMemoryClient,
  getSession: () => { sessionId: string | null; sessionName?: string },
): void {
  api.registerCommand({
    name: "remember",
    description: "Save something to memory",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx: { args?: string }) => {
      const text = ctx.args?.trim();
      if (!text) {
        return { text: "Usage: /remember <text to remember>" };
      }

      log.debug(`/remember: "${text.slice(0, 50)}"`);
      const session = getSession();
      await client.store({
        content: text,
        memoryType: detectMemoryType(text),
        sessionId: session.sessionId ?? undefined,
        sessionName: session.sessionName,
      });

      const preview = text.length > 60 ? `${text.slice(0, 60)}…` : text;
      return { text: `Remembered: "${preview}"` };
    },
  });

  api.registerCommand({
    name: "recall",
    description: "Search your memories",
    acceptsArgs: true,
    requireAuth: true,
    handler: async (ctx: { args?: string }) => {
      const query = ctx.args?.trim();
      if (!query) {
        return { text: "Usage: /recall <search query>" };
      }

      log.debug(`/recall: "${query}"`);
      const results = await client.search(query, 5);

      if (results.length === 0) {
        return { text: `No memories found for: "${query}"` };
      }

      const lines = results.map((r, i) => `${i + 1}. ${r.content}`);
      return { text: `Found ${results.length} memories:\n\n${lines.join("\n")}` };
    },
  });
}
