import type { OrcaMemoryClient } from "../client.ts";
import type { OrcaMemoryConfig } from "../config.ts";
import { log } from "../logger.ts";
import { buildSessionName } from "../memory.ts";

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

function sanitizeCapturedText(text: string): string {
  return text.replace(/<orca-memory-context>[\s\S]*?<\/orca-memory-context>\s*/g, "").trim();
}

function findLastAssistantUsage(messages: unknown[]): Record<string, unknown> | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") continue;
    const msgObj = msg as Record<string, unknown>;
    if (msgObj.role === "assistant" && msgObj.usage && typeof msgObj.usage === "object") {
      return msgObj.usage as Record<string, unknown>;
    }
  }
  return null;
}

function findModelFromMessages(messages: unknown[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") continue;
    const msgObj = msg as Record<string, unknown>;
    if (msgObj.role === "assistant" && typeof msgObj.model === "string") {
      return msgObj.model;
    }
  }
  return undefined;
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
    const contentChunks: string[] = [];
    const messagePayloads: Array<{ role: string; content: string }> = [];

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
        const text = parts.join("\n");
        const label = role === "user" ? "User" : "Assistant";
        messagePayloads.push({ role, content: sanitizeCapturedText(text) });
        contentChunks.push(`${label}: ${sanitizeCapturedText(text)}`);
      }
    }

    const captured =
      cfg.captureMode === "all"
        ? contentChunks.filter((text) => text.length >= 10)
        : contentChunks;

    if (captured.length === 0) return;

    const content = captured.join("\n\n");
    const sessionKey = getSessionKey();
    const sessionName = sessionKey ? buildSessionName(sessionKey) : undefined;
    const sessionId = getSessionId();
    
    // Extract model and usage from assistant messages (OpenClaw stores usage data there)
    const assistantUsage = findLastAssistantUsage(event.messages);
    const modelFromMessages = findModelFromMessages(event.messages);
    
    log.info(`[orca-memory] assistantUsage: ${JSON.stringify(assistantUsage)}`);
    log.info(`[orca-memory] modelFromMessages: ${modelFromMessages}`);
    
    const model = 
      (typeof event.model === "string" ? event.model : undefined) ?? 
      modelFromMessages;
    
    // Try event-level usage first (for future OpenClaw versions), fall back to assistant message usage
    const usage =
      (event.usage as Record<string, unknown> | undefined) ??
      (event.metrics as Record<string, unknown> | undefined) ??
      (event.tokenUsage as Record<string, unknown> | undefined) ??
      assistantUsage;

    const readNumber = (value: unknown) => (typeof value === "number" ? value : undefined);
    const tokensPrompt =
      readNumber(usage?.input) ??
      readNumber(usage?.prompt) ??
      readNumber(usage?.inputTokens) ??
      readNumber(usage?.promptTokens) ??
      readNumber(usage?.input_tokens) ??
      readNumber(usage?.prompt_tokens);
    const tokensCompletion =
      readNumber(usage?.output) ??
      readNumber(usage?.completion) ??
      readNumber(usage?.outputTokens) ??
      readNumber(usage?.completionTokens) ??
      readNumber(usage?.output_tokens) ??
      readNumber(usage?.completion_tokens);
    // Calculate total as input + output only (excludes cache reads which are typically free/discounted)
    const tokensTotal =
      typeof tokensPrompt === "number" || typeof tokensCompletion === "number"
        ? (tokensPrompt ?? 0) + (tokensCompletion ?? 0)
        : undefined;

    log.info(`[orca-memory] capture: ${captured.length} texts (${content.length} chars)`);
    log.info(`[orca-memory] model=${model}, tokens: prompt=${tokensPrompt}, completion=${tokensCompletion}, total=${tokensTotal}`);

    try {
      await client.store({
        content,
        memoryType: "conversations",
        metadata: {
          source: "openclaw",
          container: cfg.containerTag,
          messages: messagePayloads,
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
    } catch (err) {
      log.error("capture failed", err);
    }
  };
}
