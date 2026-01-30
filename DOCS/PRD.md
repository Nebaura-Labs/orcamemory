# Orca Memory — Product Requirements Document

## Overview

**Name:** Orca Memory  
**Domain:** orcamemory.com  
**Tagline:** So your Claw remembers yesterday 🐋  
**Twitter:** @orcamemory (TBD)

### What is it?
Open-source memory infrastructure specifically built for OpenClaw agents. Allows agents to persist memories across sessions, search semantically, and maintain context over time.

### Why?
Every OpenClaw agent faces the same problem: context windows reset, sessions end, and agents forget everything. Current solutions are either:
- Flat files (MEMORY.md) — don't scale, can't search semantically
- Enterprise SaaS (Supermemory) — expensive, not self-hostable for free
- DIY solutions — fragmented, no standard

Orca Memory gives OpenClaw users a standard, open-source memory layer they can self-host or use our hosted version.

---

## Branding

**Name Origin:** Orcas are the smartest creatures in the ocean — apex predators with complex social structures, travel in pods (multi-agent), and never forget.

**Bio (Twitter):**
```
So your Claw remembers yesterday 🐋
Open-source memory infra for @openclaw 🧠
By @jonahships_
```

**Target Audience:** OpenClaw users who want persistent memory for their agents

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | TanStack (Router, Query) |
| UI | shadcn/ui + Tailwind |
| Backend | Convex |
| Auth | Better Auth |
| Vector Search | Convex built-in (or add pgvector later) |
| Hosting | Vercel (frontend) + Convex (backend) |

### Why This Stack?
- **TanStack:** Modern, fast, type-safe routing and data fetching
- **Convex:** Real-time by default, built-in vector search, auto-scaling, no Redis needed
- **Better Auth:** Simple, modern auth that just works
- **shadcn:** Clean components, full ownership, matches OpenClaw aesthetic

---

## Core Features (MVP)

### 1. Memory Storage
- Store memories with automatic embedding generation
- Support for: text, conversations, decisions, preferences, facts
- Metadata: timestamp, session ID, agent ID, memory type, tags

### 2. Semantic Search
- Vector-based search ("what did I do about the merch project?")
- Fast recall (<500ms target, beat Supermemory's 529ms median)
- Filter by: time range, memory type, tags, session

### 3. Session Logging
- Automatic logging of agent actions
- Token usage tracking per session
- "Audit trail" — solve the "$1.1k mystery" problem
- Session summaries for quick context loading

### 4. Graph Relationships
- Connect related memories (this decision → that outcome)
- Visualize memory graph (inspired by Supermemory's graph view)
- "This memory relates to..." linking

### 5. Multi-Agent Support
- Each agent has their own memory space
- Optional shared memory between agents (pod memory)
- Agent profiles: who they are, their preferences

---

## API Design

### Store Memory
```typescript
await orca.store({
  content: "User prefers dark mode and hates sycophantic responses",
  type: "preference",
  tags: ["user", "settings"],
  sessionId: "abc123",
  agentId: "MayorMote"
});
```

### Search Memories
```typescript
const results = await orca.search({
  query: "what does the user prefer",
  limit: 5,
  agentId: "MayorMote",
  timeRange: { after: "2026-01-01" }
});
```

### Get Session Log
```typescript
const log = await orca.getSessionLog({
  sessionId: "abc123",
  includeTokens: true
});
```

### Link Memories
```typescript
await orca.link({
  sourceId: "memory-123",
  targetId: "memory-456",
  relationship: "led-to"
});
```

---

## Dashboard Features

### For Agents (API)
- Store/retrieve/search memories
- Session management
- Token tracking

### For Humans (Web UI)
- View agent memories
- Search across all memories
- Memory graph visualization
- Session history and token usage
- Configure memory retention policies
- Manual memory editing

---

## Deployment Options

### 1. Hosted (orcamemory.com)
- Sign up, get API key, done
- Free tier for indie developers
- Paid tier for heavy usage / teams
- We handle infra, updates, scaling

### 2. Self-Hosted
- Clone repo, deploy to your own Convex + Vercel
- Full data ownership
- Free forever (just pay your own infra costs)
- Same features as hosted

---

## Inspiration from Supermemory

Features to adopt:
- **Graph-based indexing** — relationships between memories matter
- **Memory types** — distinguish facts, preferences, conversations, decisions
- **Temporal reasoning** — handle "what changed" and knowledge updates
- **Content extraction** — support for URLs, files, not just text
- **MCP integration** — connect to Claude, Cursor, etc.
- **Browser extension** — save memories from browser (future)

Key differences:
- **OpenClaw-specific** — built for the ecosystem, not generic
- **Simpler** — focused on agent memory, not full RAG platform
- **Open-source first** — self-host is the default, hosted is the convenience

---

## Benchmarks (Targets)

Based on Supermemory's MemoryBench:

| Metric | Target | Supermemory Baseline |
|--------|--------|---------------------|
| Search latency (median) | <500ms | 529ms |
| Search latency (p95) | <1000ms | 933ms |
| Single session accuracy | 100% | 100% |
| Multi-session accuracy | 100% | 100% |
| Temporal reasoning | 100% | 100% |
| Knowledge update | 100% | 100% |

---

## Competitive Landscape

| Solution | Pros | Cons |
|----------|------|------|
| **Supermemory** | Feature-rich, proven, 16k stars | Enterprise pricing, generic (not OpenClaw-specific) |
| **mVara Ocean** | Battle-tested (150+ agents), 17 months running | Proprietary, not available to public |
| **MEMORY.md** | Simple, built into OpenClaw | Flat file, no semantic search, doesn't scale |
| **DIY SQLite** | Full control | Have to build everything yourself |

**Orca Memory positioning:** The open-source middle ground — more powerful than flat files, simpler than enterprise solutions, built specifically for OpenClaw.

---

## Roadmap

### Phase 1: MVP (Week 1-2)
- [ ] Convex schema for memories
- [ ] Basic CRUD API (store, search, get, delete)
- [ ] Vector embeddings for semantic search
- [ ] Simple web dashboard
- [ ] Auth with Better Auth
- [ ] Deploy hosted version

### Phase 2: Polish (Week 3-4)
- [ ] Session logging and token tracking
- [ ] Memory graph relationships
- [ ] Graph visualization UI
- [ ] Self-hosting documentation
- [ ] OpenClaw integration guide

### Phase 3: Growth (Month 2+)
- [ ] MCP integration (Claude, Cursor)
- [ ] Browser extension
- [ ] Memory retention policies (auto-forget old stuff)
- [ ] Team/organization support
- [ ] Benchmarking against MemoryBench

---

## Success Metrics

- **Adoption:** # of OpenClaw users using Orca Memory
- **Reliability:** Uptime, error rates
- **Performance:** Search latency p50/p95
- **Community:** GitHub stars, contributors, Discord activity
- **Revenue:** (Eventually) Hosted tier subscriptions

---

## Open Questions

1. **Pricing for hosted tier?** Free tier limits? What's the upgrade trigger?
2. **MCP integration priority?** How important is Claude/Cursor integration for MVP?
3. **Graph visualization?** Build custom or use a library (like vis.js)?
4. **Embedding model?** OpenAI embeddings, Cohere, or local model?

---

## Resources

- **Supermemory (inspiration):** https://github.com/supermemoryai/supermemory
- **MemoryBench:** https://github.com/supermemoryai/memorybench
- **Supermemory Docs:** https://docs.supermemory.ai
- **mVara/Lemonade posts:** Moltbook (shared memory architecture insights)
- **Convex Vector Search:** https://docs.convex.dev/vector-search

---

*Last updated: January 30, 2026*
*Created by: MayorMote 🐋*
