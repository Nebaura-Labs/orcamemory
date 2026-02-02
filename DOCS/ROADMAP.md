# Roadmap

## Beta MVP (Current Priority)

**Dashboard Core** — Required for launch
- [ ] Projects list/create/edit pages
- [ ] Agents list with status indicators
- [ ] API key generation + copy flow
- [ ] Getting started guide/onboarding
- [ ] Basic settings page

**Documentation**
- [ ] API endpoint reference
- [ ] Authentication examples
- [ ] Quick start code snippets
- [ ] Memory API usage guide

**Polish**
- [ ] Error handling + toasts
- [ ] Loading states
- [ ] Mobile responsiveness

---

## Post-Beta (Week 1-2 after launch)

**Usage & Observability**
- [ ] Usage display (tokens/searches consumed)
- [ ] Memory browser (view/search stored memories)
- [ ] Session logs viewer
- [ ] Agent health status in dashboard

**Billing**
- [ ] Plan display in settings
- [ ] Usage limits warnings
- [ ] Upgrade prompts

---

## v1.0 Features (Based on user feedback)

**Memory Upgrades**
- [ ] Memory pinning (exclude from retention cleanup)
- [ ] Importance scoring (weight search results)
- [ ] Multi-memory views (current, episodic, semantic, procedural)
- [ ] Automatic memory summarization for long-running agents

**Entity Memory** (Paid tiers: Tide+)
- [ ] Entity schema (name, type, aliases, attributes)
- [ ] Manual entity tagging via API
- [ ] Entity search/filtering
- [ ] Auto-extraction (regex/heuristics)
- [ ] Entity profiles and timelines

**Platform**
- [ ] Plan upgrades/downgrades with proration
- [ ] Team invites + roles for workspace ownership
- [ ] Per-project agent limits
- [ ] Exportable memory audit logs

---

## Future Considerations

**Advanced Entity Memory** (Abyss tier)
- [ ] LLM-powered entity extraction
- [ ] Entity relationship graphs
- [ ] Entity-based summarization

**Integrations**
- [ ] Webhook support for memory events
- [ ] SDKs for agent frameworks beyond OpenClaw
- [ ] Optional connectors for CRMs and internal docs

**Analytics**
- [ ] Session timelines with model + token usage summaries
- [ ] Recall effectiveness reports (hit rate, latency)
- [ ] Memory retention analytics

---

## Completed ✅

**Backend Core**
- [x] Memory storage with embeddings
- [x] Semantic search (vector + recency + tags)
- [x] Session logging with token tracking
- [x] Agent authentication (API keys)
- [x] Key rotation + revocation
- [x] Health endpoint
- [x] Memory retention logic
- [x] Plan structure (Surface/Tide/Abyss)
- [x] Polar billing integration
- [x] Usage tracking (tokens, searches)

**Frontend Auth**
- [x] Sign in/sign up flows
- [x] OTP verification
- [x] Onboarding flow
- [x] Workspace creation dialog

