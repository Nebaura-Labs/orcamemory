import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { OrcaMemoryClient } from "../client.ts";
import { log } from "../logger.ts";

export function registerProfileTool(
	api: OpenClawPluginApi,
	client: OrcaMemoryClient
): void {
	api.registerTool(
		{
			name: "orca_memory_profile",
			label: "Memory Profile",
			description: "Fetch memory usage stats for this agent.",
			parameters: Type.Object({}),
			async execute() {
				log.debug("profile tool");
				const profile = await client.profile();
				const currentCount = profile.current?.length ?? 0;
				return {
					content: [
						{
							type: "text" as const,
							text: `Memory profile loaded (${currentCount} current memories).`,
						},
					],
					details: profile,
				};
			},
		},
		{ name: "orca_memory_profile" }
	);
}
