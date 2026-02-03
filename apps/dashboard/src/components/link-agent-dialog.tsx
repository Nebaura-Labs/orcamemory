import { api } from "@moltcity/backend/convex/_generated/api";
import { env } from "@moltcity/env/web";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";

const buildPrompt = ({
	apiKey,
	baseUrl,
	keyId,
	pluginUrl,
}: {
	apiKey: string;
	baseUrl: string;
	keyId: string;
	pluginUrl: string;
}) => {
	const token = apiKey || "<ORCA_MEMORY_API_KEY>";
	const keyIdentifier = keyId || "<ORCA_MEMORY_KEY_ID>";
	const pluginSource = pluginUrl || "<ORCA_MEMORY_PLUGIN_URL>";
	const apiBase = baseUrl
		? `${baseUrl.replace(/\/$/, "")}/api`
		: "<ORCA_MEMORY_API_URL>";

	return `# Orca Memory Plugin Setup

Orca Memory gives your agent persistent long-term memory with semantic search. Your agent can:
- Store memories (conversations, decisions, preferences, facts)
- Search memories by meaning, not just keywords
- Recall context across sessions automatically

## Environment Variables (.env)

Add these to your .env file:

\`\`\`
ORCA_MEMORY_API_URL=${apiBase}
ORCA_MEMORY_KEY_ID=${keyIdentifier}
ORCA_MEMORY_API_KEY=${token}
\`\`\`

## Installation

1) Install the Orca Memory plugin:
\`\`\`
openclaw plugins install ${pluginSource}
\`\`\`

2) Install required dependencies:
\`\`\`
npm install @sinclair/typebox
\`\`\`

3) Restart your agent to load the plugin.

4) Test with a simple store + search:
- Store: "The user prefers dark mode"
- Search: "user preferences"

## Troubleshooting

- **401 Unauthorized**: Check that ORCA_MEMORY_KEY_ID and ORCA_MEMORY_API_KEY are correct
- **404 Not Found**: Verify ORCA_MEMORY_API_URL ends with /api (should be ${apiBase})
- **Connection timeout**: Ensure your firewall allows outbound HTTPS
- **Plugin not found**: Re-run the install command and restart your agent
- **Missing dependency**: Run \`npm install @sinclair/typebox\` if you see typebox errors

If any step fails, report the exact error message.
`;
};

type LinkAgentDialogProps = {
	isConnected?: boolean;
	onConnected?: () => void;
};

export function LinkAgentDialog({
	isConnected = false,
	onConnected,
}: LinkAgentDialogProps) {
	const convex = useConvex();
	const [open, setOpen] = useState(false);
	const [pluginUrl, setPluginUrl] = useState(() => {
		if (typeof window === "undefined") {
			return "https://app.orcamemory.com/plugins/orca-memory.tgz";
		}
		return `${window.location.origin}/plugins/orca-memory.tgz`;
	});
	const baseUrl =
		typeof window === "undefined" ? env.VITE_SITE_URL : window.location.origin;
	const [keyId, setKeyId] = useState("");
	const [apiKey, setApiKey] = useState("");
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [infoMessage, setInfoMessage] = useState<string | null>(null);
	const [isGeneratingKey, setIsGeneratingKey] = useState(false);
	const [polledConnected, setPolledConnected] = useState(false);
	const issueKey = useMutation(api.agents.issueKey);
	const { data: organizations } = authClient.useListOrganizations();
	const organizationId = organizations?.[0]?.id ?? "";
	const projects = useQuery(
		api.projects.listByOrganization,
		organizationId ? { organizationId } : "skip"
	);
	const project = projects?.[0];
	const projectId = project?._id;
	const status = useQuery(
		api.agents.getStatusByProject,
		projectId ? { projectId } : "skip"
	);
	const activeKey = useQuery(
		api.agents.getActiveKeyByProject,
		projectId ? { projectId } : "skip"
	);
	const connected = polledConnected || status?.connected || isConnected;
	const [copied, setCopied] = useState(false);
	const promptRef = useRef<HTMLTextAreaElement | null>(null);
	const hasShownConnectedToast = useRef(false);

	const prompt = useMemo(
		() => buildPrompt({ apiKey, baseUrl, keyId, pluginUrl }),
		[apiKey, baseUrl, keyId, pluginUrl]
	);

	const handleGenerateKey = async (rotate: boolean) => {
		if (!projectId || isGeneratingKey) return;
		setStatusMessage(null);
		setInfoMessage(null);
		setIsGeneratingKey(true);
		try {
			const response = await issueKey({ projectId, rotate });
			const data =
				response && typeof response === "object" && "data" in response
					? (response as { data?: unknown }).data
					: undefined;
			const payload =
				data && typeof data === "object"
					? (data as Record<string, unknown>)
					: response;
			const nextKeyId =
				payload &&
				typeof payload === "object" &&
				"keyId" in payload &&
				typeof payload.keyId === "string"
					? payload.keyId
					: payload &&
							typeof payload === "object" &&
							"key_id" in payload &&
							typeof payload.key_id === "string"
						? payload.key_id
						: "";
			const nextSecret =
				payload &&
				typeof payload === "object" &&
				"secret" in payload &&
				typeof payload.secret === "string"
					? payload.secret
					: payload &&
							typeof payload === "object" &&
							"apiKey" in payload &&
							typeof payload.apiKey === "string"
						? payload.apiKey
						: payload &&
								typeof payload === "object" &&
								"api_key" in payload &&
								typeof payload.api_key === "string"
							? payload.api_key
							: "";

			if (!(nextKeyId && nextSecret)) {
				const message =
					"Agent key created, but response was missing credentials. Refresh and try again.";
				setStatusMessage(message);
				toast.error(message);
				return;
			}

			setKeyId(nextKeyId);
			setApiKey(nextSecret);
			toast.success(
				rotate ? "New agent key generated." : "Agent key generated."
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to create agent key.";
			setStatusMessage(message);
			toast.error(message);
		} finally {
			setIsGeneratingKey(false);
		}
	};

	useEffect(() => {
		if (!open) {
			setStatusMessage(null);
			setInfoMessage(null);
			setIsGeneratingKey(false);
		}
	}, [open]);

	useEffect(() => {
		if (!(open && projectId) || connected) {
			return;
		}

		let cancelled = false;
		const intervalId = window.setInterval(async () => {
			try {
				const response = await convex.query(api.agents.getStatusByProject, {
					projectId,
				});
				if (cancelled) return;
				if (response?.connected) {
					setPolledConnected(true);
					onConnected?.();
					window.clearInterval(intervalId);
				}
			} catch {
				// Ignore polling errors; live subscription still updates status.
			}
		}, 5000);

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, [connected, convex, onConnected, open, projectId]);

	useEffect(() => {
		if (!(open && activeKey) || apiKey) return;
		setKeyId(activeKey.keyId);
		setInfoMessage(
			"For security, the API key is shown only once. Generate a new key to get a fresh secret."
		);
	}, [activeKey, apiKey, open]);

	useEffect(() => {
		if (!connected || hasShownConnectedToast.current) return;
		hasShownConnectedToast.current = true;
		toast.success("Agent connected.");
		onConnected?.();
	}, [connected, onConnected]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(prompt);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
			toast.success("Instructions copied.");
		} catch {
			const element = promptRef.current;
			if (element) {
				element.focus();
				element.select();
			}
			toast.error("Copy failed. Press Ctrl/Cmd + C.");
		}
	};

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button onClick={() => setOpen(true)}>Link OpenClaw agent</Button>
			</DialogTrigger>
			<DialogContent className="no-scrollbar max-h-[85vh] overflow-y-auto overflow-x-hidden border border-primary border-dashed p-0 sm:max-w-lg">
				<DialogHeader className="px-6 pt-4">
					<DialogTitle className="font-semibold text-foreground text-lg">
						Link OpenClaw agent
					</DialogTitle>
				</DialogHeader>

				<div className="min-w-0 space-y-4 px-6 pb-6">
					<p className="text-muted-foreground text-xs">
						Install the plugin manually, or use the prompt below to do it in one
						step.
					</p>
					{projectId ? null : (
						<p className="text-muted-foreground text-xs">
							Create a project first to generate your agent key.
						</p>
					)}
					{statusMessage ? (
						<p className="text-destructive text-xs">{statusMessage}</p>
					) : null}
					{infoMessage ? (
						<p className="text-muted-foreground text-xs">{infoMessage}</p>
					) : null}
					{apiKey ? null : (
						<Button
							className="w-full"
							disabled={!projectId || isGeneratingKey}
							onClick={() => void handleGenerateKey(Boolean(activeKey))}
							type="button"
						>
							{isGeneratingKey
								? "Generating key..."
								: activeKey
									? "Rotate agent key"
									: "Generate agent key"}
						</Button>
					)}
					<div className="min-w-0">
						<Label className="font-medium text-sm" htmlFor="orca-key-id">
							Key ID
						</Label>
						<Input
							className="mt-2 border-dashed"
							id="orca-key-id"
							onChange={(event) => setKeyId(event.target.value)}
							placeholder="omk_..."
							value={keyId}
						/>
					</div>
					<div className="min-w-0">
						<Label className="font-medium text-sm" htmlFor="orca-key">
							Orca Memory API key
						</Label>
						<Input
							className="mt-2 border-dashed"
							id="orca-key"
							onChange={(event) => setApiKey(event.target.value)}
							placeholder="oms_..."
							value={apiKey}
						/>
					</div>
					<div className="min-w-0">
						<Label className="font-medium text-sm" htmlFor="plugin-url">
							Orca Memory plugin URL
						</Label>
						<Input
							className="mt-2 border-dashed"
							id="plugin-url"
							onChange={(event) => setPluginUrl(event.target.value)}
							placeholder="https://app.orcamemory.com/plugins/orca-memory.tgz"
							value={pluginUrl}
						/>
					</div>
					<div>
						<Label className="font-medium text-sm" htmlFor="prompt-output">
							Copy‑paste prompt
						</Label>
						<Textarea
							className="mt-2 min-h-[180px] whitespace-pre-wrap break-words border-dashed"
							id="prompt-output"
							readOnly
							ref={promptRef}
							value={prompt}
						/>
					</div>
					<Button
						className="w-full"
						disabled={copied}
						onClick={() => void handleCopy()}
						type="button"
					>
						{copied ? "Copied!" : "Copy instructions"}
					</Button>
					<div className="rounded-md border border-input border-dashed bg-muted/40 px-4 py-3">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="font-medium text-foreground text-sm">
									Live status
								</p>
								<p className="text-muted-foreground text-xs">
									{connected
										? "Agent connected"
										: "Waiting for /api/agents/health confirmation"}
								</p>
							</div>
							<span
								aria-hidden="true"
								className={`h-2.5 w-2.5 rounded-full ${
									connected ? "bg-primary" : "bg-muted-foreground/40"
								}`}
							/>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
