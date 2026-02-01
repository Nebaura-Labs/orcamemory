export const MEMORY_TYPES = [
  "preferences",
  "decisions",
  "facts",
  "conversations",
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

export function detectMemoryType(text: string): MemoryType {
  const lower = text.toLowerCase();
  if (/prefer|like|love|hate|want|need|avoid/.test(lower)) {
    return "preferences";
  }
  if (/decided|decision|we will|we'll|going with|choose|selected/.test(lower)) {
    return "decisions";
  }
  if (/\+\d{10,}|@[\w.-]+\.\w+|is called|my name is|i am /.test(lower)) {
    return "facts";
  }
  return "conversations";
}

export function buildSessionName(sessionKey: string): string {
  const sanitized = sessionKey
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return `openclaw_${sanitized}`;
}
