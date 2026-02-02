import { hostname } from "node:os";

export type CaptureMode = "everything" | "all";

export type OrcaMemoryConfig = {
  apiUrl: string;
  keyId: string;
  apiKey: string;
  autoRecall: boolean;
  autoCapture: boolean;
  maxRecallResults: number;
  profileFrequency: number;
  captureMode: CaptureMode;
  debug: boolean;
  containerTag: string;
};

const ALLOWED_KEYS = [
  "apiUrl",
  "keyId",
  "apiKey",
  "autoRecall",
  "autoCapture",
  "maxRecallResults",
  "profileFrequency",
  "captureMode",
  "debug",
  "containerTag",
];

function assertAllowedKeys(value: Record<string, unknown>, allowed: string[], label: string) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${label} has unknown keys: ${unknown.join(", ")}`);
  }
}

function resolveEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (_, envVar: string) => {
    const envValue = process.env[envVar];
    if (!envValue) {
      throw new Error(`Environment variable ${envVar} is not set`);
    }
    return envValue;
  });
}

function sanitizeTag(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function defaultContainerTag(): string {
  return sanitizeTag(`openclaw_${hostname()}`);
}

export function parseConfig(raw: unknown): OrcaMemoryConfig {
  const cfg =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  if (Object.keys(cfg).length > 0) {
    assertAllowedKeys(cfg, ALLOWED_KEYS, "orca memory config");
  }

  const apiUrl =
    typeof cfg.apiUrl === "string" && cfg.apiUrl.length > 0
      ? resolveEnvVars(cfg.apiUrl)
      : process.env.ORCA_MEMORY_API_URL ?? "https://app.orcamemory.com/api";

  const keyId =
    typeof cfg.keyId === "string" && cfg.keyId.length > 0
      ? resolveEnvVars(cfg.keyId)
      : process.env.ORCA_MEMORY_KEY_ID;

  const apiKey =
    typeof cfg.apiKey === "string" && cfg.apiKey.length > 0
      ? resolveEnvVars(cfg.apiKey)
      : process.env.ORCA_MEMORY_API_KEY;

  if (!apiUrl || !keyId || !apiKey) {
    throw new Error(
      "orca-memory: apiUrl, keyId, and apiKey are required (set in plugin config or ORCA_MEMORY_* env vars)",
    );
  }

  return {
    apiUrl: apiUrl.replace(/\/$/, ""),
    keyId,
    apiKey,
    autoRecall: (cfg.autoRecall as boolean) ?? true,
    autoCapture: (cfg.autoCapture as boolean) ?? true,
    maxRecallResults: (cfg.maxRecallResults as number) ?? 10,
    profileFrequency: (cfg.profileFrequency as number) ?? 1,
    captureMode:
      cfg.captureMode === "everything" ? "everything" : "all",
    debug: (cfg.debug as boolean) ?? false,
    containerTag: cfg.containerTag
      ? sanitizeTag(String(cfg.containerTag))
      : defaultContainerTag(),
  };
}

export const orcaMemoryConfigSchema = {
  parse: parseConfig,
};
