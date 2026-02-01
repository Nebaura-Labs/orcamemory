# Orca Memory OpenClaw Plugin

This plugin connects OpenClaw agents to Orca Memory for persistent context and retrieval.

## Config
- `apiUrl`: Orca Memory API base (for example `https://app.orcamemory.com/api`)
- `keyId`: Agent key ID issued by Orca Memory
- `apiKey`: Agent secret

You can also set environment variables:
- `ORCA_MEMORY_API_URL`
- `ORCA_MEMORY_KEY_ID`
- `ORCA_MEMORY_API_KEY`

## Tools
- `orca_memory_store`
- `orca_memory_search`
- `orca_memory_forget`
- `orca_memory_profile`
