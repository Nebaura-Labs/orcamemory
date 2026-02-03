import { log } from "./logger.ts";

export type MemoryResult = {
	id: string;
	content: string;
	memoryType?: string | null;
	tags?: string[];
	createdAt?: number;
	metadata?: Record<string, unknown> | null;
};

export type ProfileResult = {
	current: MemoryResult[];
	searchResults: MemoryResult[];
	usage?: Record<string, unknown> | null;
};

export class OrcaMemoryClient {
	private apiUrl: string;
	private keyId: string;
	private apiKey: string;

	constructor(apiUrl: string, keyId: string, apiKey: string) {
		this.apiUrl = apiUrl.replace(/\/$/, "");
		this.keyId = keyId;
		this.apiKey = apiKey;
	}

	private headers(): HeadersInit {
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${this.apiKey}`,
			"X-Orca-Key-Id": this.keyId,
		};
	}

	private async post<T>(path: string, payload: unknown): Promise<T> {
		const response = await fetch(`${this.apiUrl}${path}`, {
			method: "POST",
			headers: this.headers(),
			body: JSON.stringify(payload),
		});
		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Orca Memory request failed (${response.status}): ${body}`
			);
		}
		return (await response.json()) as T;
	}

	private async get<T>(path: string): Promise<T> {
		const response = await fetch(`${this.apiUrl}${path}`, {
			method: "GET",
			headers: this.headers(),
		});
		if (!response.ok) {
			const body = await response.text();
			throw new Error(
				`Orca Memory request failed (${response.status}): ${body}`
			);
		}
		return (await response.json()) as T;
	}

	async store(args: {
		content: string;
		memoryType?: string;
		tags?: string[];
		metadata?: Record<string, unknown>;
		sessionId?: string;
		sessionName?: string;
		model?: string;
		tokensPrompt?: number;
		tokensCompletion?: number;
		tokensTotal?: number;
		eventKind?: string;
		eventContent?: string;
	}): Promise<{ id: string; sessionId?: string | null }> {
		log.debug(`store: ${args.content.slice(0, 80)}`);
		return await this.post("/memory/store", args);
	}

	async search(query: string, limit = 10): Promise<MemoryResult[]> {
		log.debug(`search: "${query}"`);
		const response = await this.post<{ results: MemoryResult[] }>(
			"/memory/search",
			{
				query,
				limit,
			}
		);
		return response.results ?? [];
	}

	async searchWithFilters(params: {
		query: string;
		limit?: number;
		memoryType?: string;
		tags?: string[];
	}): Promise<MemoryResult[]> {
		const response = await this.post<{ results: MemoryResult[] }>(
			"/memory/search",
			params
		);
		return response.results ?? [];
	}

	async forget(ids: string[]): Promise<{ deleted: number }> {
		return await this.post("/memory/forget", { ids });
	}

	async profile(): Promise<ProfileResult> {
		return (await this.get("/memory/profile")) as ProfileResult;
	}

	async startSession(name: string, model?: string): Promise<string | null> {
		try {
			const response = await this.post<{ sessionId: string }>(
				"/sessions/start",
				{
					name,
					model,
				}
			);
			return response.sessionId ?? null;
		} catch (err) {
			log.debug(`session start skipped: ${String(err)}`);
			return null;
		}
	}

	async recordSessionEvent(args: {
		sessionId: string;
		kind: string;
		model?: string;
		content?: string;
		tokensPrompt?: number;
		tokensCompletion?: number;
		tokensTotal?: number;
	}): Promise<void> {
		try {
			await this.post("/sessions/record", args);
		} catch (err) {
			log.debug(`session record skipped: ${String(err)}`);
		}
	}
}
