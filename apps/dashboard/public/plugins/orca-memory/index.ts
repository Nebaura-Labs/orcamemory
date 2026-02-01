import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

import { OrcaMemoryClient } from "./client.ts";
import { registerCli } from "./commands/cli.ts";
import { registerCommands } from "./commands/slash.ts";
import { parseConfig, orcaMemoryConfigSchema } from "./config.ts";
import { buildCaptureHandler } from "./hooks/capture.ts";
import { buildRecallHandler } from "./hooks/recall.ts";
import { initLogger } from "./logger.ts";
import { buildSessionName } from "./memory.ts";
import { registerForgetTool } from "./tools/forget.ts";
import { registerProfileTool } from "./tools/profile.ts";
import { registerSearchTool } from "./tools/search.ts";
import { registerStoreTool } from "./tools/store.ts";

export default {
  id: "orca-memory",
  name: "Orca Memory",
  description: "OpenClaw memory plugin powered by Orca Memory",
  kind: "memory" as const,
  configSchema: orcaMemoryConfigSchema,

  register(api: OpenClawPluginApi) {
    const cfg = parseConfig(api.pluginConfig);
    initLogger(api.logger, cfg.debug);

    const client = new OrcaMemoryClient(cfg.apiUrl, cfg.keyId, cfg.apiKey);
    let sessionKey: string | undefined;
    let sessionId: string | null = null;

    const getSessionContext = () => ({
      sessionId,
      sessionName: sessionKey ? buildSessionName(sessionKey) : undefined,
    });

    const ensureSession = async (maybeSessionKey?: string) => {
      if (!maybeSessionKey) return;
      if (sessionKey === maybeSessionKey && sessionId) return;

      sessionKey = maybeSessionKey;
      const name = buildSessionName(maybeSessionKey);
      sessionId = await client.startSession(name);
    };

    registerSearchTool(api, client, cfg);
    registerStoreTool(api, client, getSessionContext);
    registerForgetTool(api, client);
    registerProfileTool(api, client);

    if (cfg.autoRecall) {
      const recallHandler = buildRecallHandler(client, cfg);
      const handleRecall = async (event: unknown, ctx: { sessionKey?: string }) => {
        if (ctx.sessionKey) {
          await ensureSession(ctx.sessionKey);
        }
        return recallHandler(event as Record<string, unknown>);
      };
      api.on("before_agent_start", handleRecall);
      api.on("message_received", handleRecall);
    }

    if (cfg.autoCapture) {
      const captureHandler = buildCaptureHandler(
        client,
        cfg,
        () => sessionKey,
        () => sessionId,
      );
      api.on("agent_end", async (event, ctx) => {
        if (ctx.sessionKey) {
          await ensureSession(ctx.sessionKey);
        }
        return captureHandler(event as Record<string, unknown>);
      });
    }

    registerCommands(api, client, getSessionContext);
    registerCli(api, client);

    api.registerService({
      id: "orca-memory",
      start: () => {
        api.logger.info?.("orca-memory: connected");
      },
      stop: () => {
        api.logger.info?.("orca-memory: stopped");
      },
    });
  },
};
