import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { OrcaMemoryClient } from "../client.ts";

export function registerCli(
	api: OpenClawPluginApi,
	client: OrcaMemoryClient
): void {
	api.registerCli(
		({ program }) => {
			const memory = program
				.command("memory")
				.description("Orca Memory commands");

			memory
				.command("search")
				.description("Search memories")
				.argument("<query>", "Search query")
				.option("--limit <n>", "Max results", "5")
				.action(async (query, opts) => {
					const limit = Number.parseInt(opts.limit, 10);
					const results = await client.search(
						query,
						Number.isNaN(limit) ? 5 : limit
					);
					console.log(JSON.stringify(results, null, 2));
				});

			memory
				.command("profile")
				.description("Show memory profile")
				.action(async () => {
					const profile = await client.profile();
					console.log(JSON.stringify(profile, null, 2));
				});
		},
		{ commands: ["memory"] }
	);
}
