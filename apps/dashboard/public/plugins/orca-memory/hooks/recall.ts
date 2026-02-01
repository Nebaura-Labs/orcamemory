import type { OrcaMemoryClient } from "../client.ts";
import type { OrcaMemoryConfig } from "../config.ts";
import { log } from "../logger.ts";

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "";
  const now = Date.now();
  const diffSec = Math.max(0, (now - timestamp) / 1000);
  const minutes = diffSec / 60;
  const hours = minutes / 60;
  const days = hours / 24;

  if (minutes < 30) return "just now";
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (days < 7) return `${Math.floor(days)}d ago`;

  const dt = new Date(timestamp);
  const month = dt.toLocaleString("en", { month: "short" });
  return `${dt.getDate()} ${month}`;
}

function formatContext(
  current: { content: string; createdAt?: number; memoryType?: string | null }[],
  searchResults: { content: string; createdAt?: number; memoryType?: string | null }[],
  maxResults: number,
): string | null {
  const currentLines = current.slice(0, maxResults).map((entry) => {
    const time = formatRelativeTime(entry.createdAt);
    const type = entry.memoryType ? `[${entry.memoryType}] ` : "";
    const prefix = time ? `[${time}] ` : "";
    return `- ${prefix}${type}${entry.content}`;
  });

  const searchLines = searchResults.slice(0, maxResults).map((entry) => {
    const time = formatRelativeTime(entry.createdAt);
    const type = entry.memoryType ? `[${entry.memoryType}] ` : "";
    const prefix = time ? `[${time}] ` : "";
    return `- ${prefix}${type}${entry.content}`;
  });

  if (currentLines.length === 0 && searchLines.length === 0) {
    return null;
  }

  const sections: string[] = [];
  if (currentLines.length > 0) {
    sections.push(`## Memory Current\n${currentLines.join("\n")}`);
  }
  if (searchLines.length > 0) {
    sections.push(`## Relevant Memories\n${searchLines.join("\n")}`);
  }

  return `<orca-memory-context>\nThe following is recalled context about the user. Reference it only when relevant.\n\n${sections.join("\n\n")}\n\nUse these memories naturally when relevant and avoid assumptions.\n</orca-memory-context>`;
}

function countUserTurns(messages: unknown[]): number {
  let count = 0;
  for (const msg of messages) {
    if (
      msg &&
      typeof msg === "object" &&
      (msg as Record<string, unknown>).role === "user"
    ) {
      count += 1;
    }
  }
  return count;
}

export function buildRecallHandler(client: OrcaMemoryClient, cfg: OrcaMemoryConfig) {
  return async (event: Record<string, unknown>) => {
    const prompt =
      (event.prompt as string | undefined) ??
      (typeof event.message === "object" && event.message
        ? ((event.message as Record<string, unknown>).content as string | undefined)
        : undefined) ??
      (typeof event.input === "object" && event.input
        ? ((event.input as Record<string, unknown>).content as string | undefined) ??
          ((event.input as Record<string, unknown>).prompt as string | undefined)
        : undefined) ??
      (() => {
        const messages = Array.isArray(event.messages) ? event.messages : [];
        for (let index = messages.length - 1; index >= 0; index -= 1) {
          const msg = messages[index];
          if (
            msg &&
            typeof msg === "object" &&
            (msg as Record<string, unknown>).role === "user"
          ) {
            const content = (msg as Record<string, unknown>).content;
            if (typeof content === "string") {
              return content;
            }
          }
        }
        return undefined;
      })();
    if (!prompt || prompt.length < 3) return;

    const messages = Array.isArray(event.messages) ? event.messages : [];
    const turn = countUserTurns(messages);
    const includeProfile = turn <= 1 || turn % cfg.profileFrequency === 0;

    log.debug(`recall: turn ${turn} (profile=${includeProfile})`);

    try {
      const profile = includeProfile ? await client.profile() : null;
      const searchResults = await client.search(prompt, cfg.maxRecallResults);

      const context = formatContext(
        profile?.current ?? [],
        searchResults,
        cfg.maxRecallResults,
      );

      if (!context) return;

      return { prependContext: context };
    } catch (err) {
      log.error("recall failed", err);
      return;
    }
  };
}
