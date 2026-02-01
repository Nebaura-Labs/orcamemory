import type { OrcaMemoryClient } from "../client.ts";
import type { OrcaMemoryConfig } from "../config.ts";
import { log } from "../logger.ts";
import { buildSessionName, detectMemoryType } from "../memory.ts";

function getLastTurn(messages: unknown[]): unknown[] {
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg && typeof msg === "object" && (msg as Record<string, unknown>).role === "user") {
      lastUserIdx = i;
      break;
    }
  }
  return lastUserIdx >= 0 ? messages.slice(lastUserIdx) : messages;
}

export function buildCaptureHandler(
  client: OrcaMemoryClient,
  cfg: OrcaMemoryConfig,
  getSessionKey: () => string | undefined,
  getSessionId: () => string | null,
) {
  return async (event: Record<string, unknown>) => {
    if (!event.success || !Array.isArray(event.messages) || event.messages.length === 0) {
      return;
    }

    const lastTurn = getLastTurn(event.messages);
    const texts: string[] = [];

    for (const msg of lastTurn) {
      if (!msg || typeof msg !== "object") continue;
      const msgObj = msg as Record<string, unknown>;
      const role = msgObj.role;
      if (role !== "user" && role !== "assistant") continue;

      const content = msgObj.content;
      const parts: string[] = [];

      if (typeof content === "string") {
        parts.push(content);
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (!block || typeof block !== "object") continue;
          const b = block as Record<string, unknown>;
          if (b.type === "text" && typeof b.text === "string") {
            parts.push(b.text);
          }
        }
      }

      if (parts.length > 0) {
        texts.push(`[role: ${role}]\n${parts.join("\n")}\n[${role}:end]`);
      }
    }

    const captured =
      cfg.captureMode === "all"
        ? texts
            .map((text) =>
              text.replace(/<orca-memory-context>[\s\S]*?<\/orca-memory-context>\s*/g, "").trim(),
            )
            .filter((text) => text.length >= 10)
        : texts;

    if (captured.length === 0) return;

    const content = captured.join("\n\n");
    const sessionKey = getSessionKey();
    const sessionName = sessionKey ? buildSessionName(sessionKey) : undefined;
    const sessionId = getSessionId();
    const model = typeof event.model === "string" ? event.model : undefined;
    const usage =
      (event.usage as Record<string, unknown> | undefined) ??
      (event.metrics as Record<string, unknown> | undefined) ??
      (event.tokenUsage as Record<string, unknown> | undefined);

    const readNumber = (value: unknown) => (typeof value === "number" ? value : undefined);
    const tokensPrompt =
      readNumber(usage?.input) ??
      readNumber(usage?.prompt) ??
      readNumber(usage?.inputTokens) ??
      readNumber(usage?.promptTokens);
    const tokensCompletion =
      readNumber(usage?.output) ??
      readNumber(usage?.completion) ??
      readNumber(usage?.outputTokens) ??
      readNumber(usage?.completionTokens);
    const tokensTotal =
      readNumber(usage?.total) ??
      readNumber(usage?.totalTokens) ??
      readNumber(usage?.tokensTotal) ??
      (typeof tokensPrompt === "number" || typeof tokensCompletion === "number"
        ? (tokensPrompt ?? 0) + (tokensCompletion ?? 0)
        : undefined);

    log.debug(`capture: ${captured.length} texts (${content.length} chars)`);

    try {
      await client.store({
        content,
        memoryType: detectMemoryType(content),
        metadata: {
          source: "openclaw",
          container: cfg.containerTag,
          model,
          tokensPrompt,
          tokensCompletion,
          tokensTotal,
        },
        sessionId: sessionId ?? undefined,
        sessionName,
        model,
        tokensPrompt,
        tokensCompletion,
        tokensTotal,
        eventKind: "conversation",
        eventContent: content,
      });

      if (sessionId) {
        await client.recordSessionEvent({
          sessionId,
          kind: "conversation",
          model,
          content,
          tokensPrompt,
          tokensCompletion,
          tokensTotal,
        });
      }
    } catch (err) {
      log.error("capture failed", err);
    }
  };
}
