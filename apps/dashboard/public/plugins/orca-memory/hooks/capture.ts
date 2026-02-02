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

type DiscordContext = {
  guildName?: string;
  channelId?: string;
  username?: string;
  displayName?: string;
  userId?: string;
  messageId?: string;
  timestamp?: string;
  cleanContent: string;
};

// Parse Discord context from OpenClaw message format
// Format: [Discord Guild 'guildName' channel id:channelId +Xm YYYY-MM-DD HH:MM UTC] DisplayName (username): message [from: DisplayName (userId)]
// Or: [message_id: messageId]
function parseDiscordContext(text: string): DiscordContext {
  let content = text;
  const context: DiscordContext = { cleanContent: text };

  // Match Discord header: [Discord Guild 'name' channel id:123 +4m 2026-02-01 13:07 UTC]
  const headerMatch = content.match(
    /^\[Discord Guild '([^']+)' channel id:(\d+)\s+[^\]]+\]\s*/i
  );
  if (headerMatch) {
    context.guildName = headerMatch[1];
    context.channelId = headerMatch[2];
    content = content.slice(headerMatch[0].length);
  }

  // Match user info: DisplayName (username): message
  const userMatch = content.match(/^([^(]+)\s*\(([^)]+)\):\s*/);
  if (userMatch) {
    context.displayName = userMatch[1].trim();
    context.username = userMatch[2].trim();
    content = content.slice(userMatch[0].length);
  }

  // Match [message_id: 123] anywhere (could be on separate line)
  const msgIdMatch = content.match(/\n?\[message_id:\s*(\d+)\]/);
  if (msgIdMatch) {
    context.messageId = msgIdMatch[1];
    content = content.replace(msgIdMatch[0], "");
  }

  // Match trailing [from: DisplayName (userId)] - now at end after message_id removed
  const fromMatch = content.match(/\s*\[from:\s*([^(]+)\s*\((\d+)\)\]\s*$/);
  if (fromMatch) {
    if (!context.displayName) context.displayName = fromMatch[1].trim();
    context.userId = fromMatch[2];
    content = content.slice(0, content.length - fromMatch[0].length);
  }

  context.cleanContent = content.trim();
  return context;
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
    const cleanContentChunks: string[] = [];
    const messagePayloads: Array<{ role: string; content: string; rawContent?: string }> = [];
    let discordMeta: Partial<DiscordContext> = {};

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
        const rawText = sanitizeCapturedText(parts.join("\n"));
        
        // Parse Discord context from user messages
        if (role === "user") {
          const parsed = parseDiscordContext(rawText);
          if (parsed.guildName || parsed.channelId || parsed.userId) {
            discordMeta = {
              guildName: parsed.guildName ?? discordMeta.guildName,
              channelId: parsed.channelId ?? discordMeta.channelId,
              username: parsed.username ?? discordMeta.username,
              displayName: parsed.displayName ?? discordMeta.displayName,
              userId: parsed.userId ?? discordMeta.userId,
              messageId: parsed.messageId ?? discordMeta.messageId,
            };
          }
          messagePayloads.push({ role, content: parsed.cleanContent, rawContent: rawText });
          cleanContentChunks.push(`User: ${parsed.cleanContent}`);
        } else {
          messagePayloads.push({ role, content: rawText });
          cleanContentChunks.push(`Assistant: ${rawText}`);
        }
      }
    }

    const captured =
      cfg.captureMode === "all"
        ? cleanContentChunks.filter((text) => text.length >= 10)
        : cleanContentChunks;

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
    if (discordMeta.guildName) {
      log.info(`[orca-memory] discord: guild=${discordMeta.guildName}, user=${discordMeta.displayName} (${discordMeta.userId})`);
    }

    // Determine source based on detected context
    const source = discordMeta.guildName ? "discord" : "openclaw";

    try {
      await client.store({
        content,
        memoryType: "conversations",
        metadata: {
          source,
          container: cfg.containerTag,
          messages: messagePayloads,
          model,
          tokensPrompt,
          tokensCompletion,
          tokensTotal,
          // Discord-specific metadata (only included if present)
          ...(discordMeta.guildName && {
            discord: {
              guildName: discordMeta.guildName,
              channelId: discordMeta.channelId,
              username: discordMeta.username,
              displayName: discordMeta.displayName,
              userId: discordMeta.userId,
              messageId: discordMeta.messageId,
            },
          }),
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
