import type { MemoryResult, OrcaMemoryClient } from "../client.ts";
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

type RecallEntry = {
	content: string;
	createdAt?: number;
	memoryType?: string | null;
	metadata?: Record<string, unknown> | null;
};

function formatUsage(entry: RecallEntry): string {
	const meta = entry.metadata ?? undefined;
	if (!meta) return "";
	const model = typeof meta.model === "string" ? meta.model : "";
	const tokensPrompt =
		typeof meta.tokensPrompt === "number" ? meta.tokensPrompt : undefined;
	const tokensCompletion =
		typeof meta.tokensCompletion === "number"
			? meta.tokensCompletion
			: undefined;
	const tokensTotal =
		typeof meta.tokensTotal === "number" ? meta.tokensTotal : undefined;
	const parts: string[] = [];
	if (model) parts.push(model);
	if (
		typeof tokensPrompt === "number" ||
		typeof tokensCompletion === "number"
	) {
		parts.push(`${tokensPrompt ?? 0} in / ${tokensCompletion ?? 0} out`);
	} else if (typeof tokensTotal === "number") {
		parts.push(`${tokensTotal} tokens`);
	}
	return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

function formatContext(
	current: RecallEntry[],
	searchResults: RecallEntry[],
	maxResults: number
): string | null {
	const currentLines = current.slice(0, maxResults).map((entry) => {
		const time = formatRelativeTime(entry.createdAt);
		const type = entry.memoryType ? `[${entry.memoryType}] ` : "";
		const prefix = time ? `[${time}] ` : "";
		const usage = formatUsage(entry);
		return `- ${prefix}${type}${entry.content}${usage}`;
	});

	const searchLines = searchResults.slice(0, maxResults).map((entry) => {
		const time = formatRelativeTime(entry.createdAt);
		const type = entry.memoryType ? `[${entry.memoryType}] ` : "";
		const prefix = time ? `[${time}] ` : "";
		const usage = formatUsage(entry);
		return `- ${prefix}${type}${entry.content}${usage}`;
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

const STOPWORDS = new Set([
	"a",
	"an",
	"and",
	"are",
	"as",
	"at",
	"be",
	"but",
	"by",
	"for",
	"from",
	"has",
	"have",
	"how",
	"i",
	"in",
	"is",
	"it",
	"just",
	"me",
	"my",
	"of",
	"on",
	"or",
	"our",
	"please",
	"s",
	"so",
	"that",
	"the",
	"their",
	"there",
	"they",
	"this",
	"to",
	"us",
	"was",
	"we",
	"were",
	"what",
	"when",
	"where",
	"who",
	"why",
	"with",
	"you",
	"your",
]);

function buildKeywordQuery(prompt: string, limit = 8): string | null {
	const words = prompt
		.replace(/[^a-zA-Z0-9\s']/g, " ")
		.split(/\s+/)
		.filter(Boolean);

	const scored: { word: string; score: number }[] = [];
	const seen = new Set<string>();
	for (const raw of words) {
		const lower = raw.toLowerCase();
		if (STOPWORDS.has(lower)) continue;
		const score = raw[0] === raw[0]?.toUpperCase() ? 2 : 1;
		const normalized = lower;
		if (!normalized || normalized.length < 3) continue;
		if (seen.has(normalized)) continue;
		seen.add(normalized);
		scored.push({ word: raw, score });
	}

	scored.sort((a, b) => b.score - a.score);
	const terms = scored.slice(0, limit).map((entry) => entry.word);
	return terms.length > 0 ? terms.join(" ") : null;
}

export function buildRecallHandler(
	client: OrcaMemoryClient,
	cfg: OrcaMemoryConfig
) {
	return async (event: Record<string, unknown>) => {
		const prompt =
			(event.prompt as string | undefined) ??
			(typeof event.message === "object" && event.message
				? ((event.message as Record<string, unknown>).content as
						| string
						| undefined)
				: undefined) ??
			(typeof event.input === "object" && event.input
				? (((event.input as Record<string, unknown>).content as
						| string
						| undefined) ??
					((event.input as Record<string, unknown>).prompt as
						| string
						| undefined))
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
			const keywordQuery = buildKeywordQuery(prompt);
			const [searchResultsRaw, searchResultsKeywords] = await Promise.all([
				client.search(prompt, cfg.maxRecallResults),
				keywordQuery && keywordQuery !== prompt
					? client.search(keywordQuery, cfg.maxRecallResults)
					: Promise.resolve([]),
			]);
			const mergedResults = new Map<string, MemoryResult>();
			for (const result of searchResultsRaw) {
				mergedResults.set(result.id, result);
			}
			for (const result of searchResultsKeywords) {
				mergedResults.set(result.id, result);
			}

			const context = formatContext(
				profile?.current ?? [],
				Array.from(mergedResults.values()),
				cfg.maxRecallResults
			);

			if (!context) return;

			return { prependContext: context };
		} catch (err) {
			log.error("recall failed", err);
			return;
		}
	};
}
