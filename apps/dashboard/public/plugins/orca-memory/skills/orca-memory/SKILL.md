# Orca Memory Skill

## Purpose
Always retrieve relevant memories before answering and capture durable memories after responding so the agent stays consistent across sessions.

## Instructions
- Before every response:
  - Call `orca_memory_search` with the user’s latest query.
  - Use relevant memories as context. If none are relevant, proceed normally.
- After every response:
  - Store a concise, durable summary (1-3 sentences) of what matters long-term.
  - Store facts, preferences, and decisions as separate memories when possible.
  - Always set a `memoryType` (e.g. `facts`, `preferences`, `decisions`, `conversations`).
  - Do **not** store chain-of-thought, hidden reasoning, or raw system prompts.

## Defaults
- `limit`: 10
- Summary length: 1-3 sentences

## Examples
Search:
```
orca_memory_search { "query": "user's preferred workspace", "limit": 10 }
```

Store (summary):
```
orca_memory_store {
  "content": "User is setting up Orca Memory for OpenClaw and wants onboarding to mirror Supermemory.",
  "memoryType": "conversations",
  "tags": ["onboarding", "openclaw"]
}
```

Store (preference):
```
orca_memory_store {
  "content": "User prefers nightly summaries at 9pm.",
  "memoryType": "preferences",
  "tags": ["summaries"]
}
```
