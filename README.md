![Orca Memory OG image](apps/web/public/og-image.png)

# Orca Memory

Open-source memory infrastructure for AI agents. Persist memories across sessions, search semantically, and maintain context over time.

- **Domains:** [orcamemory.com](https://orcamemory.com) (web) • [app.orcamemory.com](https://app.orcamemory.com) (dashboard)
- **Tagline:** So your Claw remembers yesterday 🐋
- **X/Twitter:** [@orcamemoryai](https://x.com/orcamemoryai)

## Docs

- Product requirements: [DOCS/PRD.md](DOCS/PRD.md)
- Roadmap: [DOCS/ROADMAP.md](DOCS/ROADMAP.md)

## Rules

- PR & contribution rules: [rules/PR.md](rules/PR.md)
- Greptile review rules: [rules/GREPTILE.md](rules/GREPTILE.md)
- Agent instructions: [AGENTS.md](AGENTS.md)

## Core Features

- **Memory Storage** — store memories with embeddings and metadata
- **Semantic Search** — vector search powered by CPU-friendly embeddings service
- **Session Logging** — complete audit trail with token tracking and event streaming
- **Usage Metering** — token and search usage tracking with Polar webhooks
- **Multi-Agent Support** — per-agent memory spaces with workspace isolation
- **Organization-Based Billing** — workspace plans with usage limits and overages

## Tech Stack

### Frontend
- **TypeScript** — type safety and developer experience
- **TanStack Start** — SSR framework with TanStack Router
- **Nitro** — production server for SSR + static assets
- **React 19** — UI framework with latest features
- **Tailwind CSS v4** + **shadcn/ui** — styling and components
- **Bklit Analytics** — privacy-focused analytics

### Backend
- **Convex** — real-time backend and database with vector search
- **Better Auth** — authentication with Convex adapter
- **Twilio Verify** — OTP verification for phone auth
- **Polar** — subscription billing and usage metering
- **Resend** — transactional email

### Infrastructure
- **Bun** — package manager and runtime (required for SSR)
- **Python/FastAPI** — embeddings microservice (intfloat/e5-base-v2)
- **Docker** — containerization for web, dashboard, and embeddings
- **Coolify** — self-hosted deployment platform
- **Ultracite/Biome** — linting and formatting
- **Turborepo** — monorepo build orchestration

## Plans & Billing

Workspace-based plans (organization-level billing via Polar):

| Plan | Price | Projects | Agents/Project | Tokens | Searches | Memory Retention |
|------|-------|----------|----------------|--------|----------|------------------|
| **Surface** (Free) | $0/mo | 1 | 1 | 500K | 5K | 30 days max |
| **Tide** | $24/mo | 10 | 5 | 5M | 200K | 6 months max |
| **Abyss** | $149/mo | 50 | 20 | 25M | 2M | Unlimited |

**Memory Retention Options:**
- 30 Days, 90 Days, Six Months, One Year, Keep Forever
- Options are gated by plan (e.g., Surface can only select 30 Days)
- Expired memories are automatically deleted by a daily cleanup cron

**Overages (paid tiers):**
- Tokens: $0.01 / 1K tokens
- Searches: $0.10 / 1K searches

**Polar Integration:**
- Usage meters: `tokens_processed`, `search_queries`
- Webhook endpoint: `https://<convex-http>/polar/events`
- Events: `product.*`, `subscription.*`
- Sync products: `bunx convex run polar_actions:syncProducts`

## Project Structure

```
orcamemory/
├── apps/
│   ├── web/              # Marketing site (orcamemory.com)
│   ├── dashboard/        # Dashboard app (app.orcamemory.com)
│   └── embeddings/       # Python embedding service (FastAPI)
├── packages/
│   ├── backend/          # Convex backend functions and schema
│   ├── config/           # Shared config (Biome, TypeScript)
│   └── env/              # Environment variable validation
├── DOCS/                 # Product docs and specs
└── rules/                # PR and review guidelines
```

## Getting Started

### Prerequisites

- **Bun** 1.3+ (required for SSR runtime)
- **Python** 3.11+ (for embeddings service)
- **Convex** account (cloud or self-hosted)
- **Docker** (optional, for containerized deployment)

### Installation

```bash
# Install all dependencies
bun install

# Setup Convex backend
bun run dev:setup
```

Follow the prompts to create a Convex project and get your deployment URL.

### Environment Variables

Copy `.env.example` to create environment files for each app.

**Backend (Convex)** — `packages/backend/.env.local`:
```bash
# Core
SITE_URL=https://app.orcamemory.com
FRONTEND_URL=https://app.orcamemory.com
COOKIE_DOMAIN=.orcamemory.com
BETTER_AUTH_SECRET=your-secret-key

# Embeddings Service
EMBEDDING_URL=http://localhost:8008
EMBEDDING_MODEL=intfloat/e5-base-v2
MEMORY_VECTOR_SCAN_LIMIT=2000

# Authentication
GITHUB_CLIENT_ID=your-github-oauth-id
GITHUB_CLIENT_SECRET=your-github-oauth-secret

# OTP via Twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_VERIFY_SERVICE_SID=your-verify-service

# Email via Resend
RESEND_SEND_API_KEY=your-resend-api-key
RESEND_CONTACTS_API_KEY=your-contacts-key
RESEND_AUDIENCE_ID=your-audience-id

# Billing via Polar
POLAR_ORGANIZATION_TOKEN=your-polar-token
POLAR_WEBHOOK_SECRET=your-webhook-secret
POLAR_PRODUCT_SURFACE_ID=prod_xxx
POLAR_PRODUCT_TIDE_ID=prod_xxx
POLAR_PRODUCT_ABYSS_ID=prod_xxx
```

**Frontend (web + dashboard)** — `apps/web/.env` and `apps/dashboard/.env`:
```bash
# Convex
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
VITE_INTERNAL_SITE_URL=http://localhost:3002

# Analytics (Bklit)
VITE_BKLIT_PROJECT_ID=your-project-id
VITE_BKLIT_API_KEY=your-api-key
VITE_BKLIT_API_HOST=https://analytics.nebaura.studio
VITE_BKLIT_ENVIRONMENT=production
VITE_BKLIT_DEBUG=false
```

**Embeddings Service** — `apps/embeddings/.env`:
```bash
EMBEDDING_MODEL=intfloat/e5-base-v2
EMBEDDING_MAX_BATCH=32
```

### Development

```bash
# Start all services (web + dashboard + convex)
bun run dev

# Start individual services
bun run dev:web        # Web app (localhost:3001)
bun run dev:dashboard  # Dashboard (localhost:3002)
bun run dev:server     # Convex backend

# Start embeddings service
cd apps/embeddings
pip install -r requirements.txt
uvicorn main:app --reload --port 8008
```

### Production Build

```bash
# Build all apps
bun run build

# Build individual apps
bun --cwd apps/web run build
bun --cwd apps/dashboard run build

# Serve with Nitro SSR
bun apps/web/.output/server/index.mjs
bun apps/dashboard/.output/server/index.mjs
```

## Deployment

### Coolify (Nixpacks)

**Web App** (orcamemory.com):
```bash
# Install
bun install

# Build
cd apps/web && bun run build

# Start
cd apps/web && bun run serve:host
```

**Dashboard** (app.orcamemory.com):
```bash
# Install
bun install

# Build
cd apps/dashboard && bun run build

# Start
cd apps/dashboard && bun run serve:host
```

**Environment:**
- Set `PORT=3001` for web, `PORT=3002` for dashboard
- Add all frontend env vars from `.env.example`

### Docker

Build and run individual services:

```bash
# Web app
docker build -f Dockerfile.web -t orca-web .
docker run -p 3001:3001 -e PORT=3001 orca-web

# Dashboard
docker build -f Dockerfile.dashboard -t orca-dashboard .
docker run -p 3002:3002 -e PORT=3002 orca-dashboard

# Embeddings
cd apps/embeddings
docker build -t orca-embeddings .
docker run -p 8008:8008 orca-embeddings
```

### Convex Self-Hosted

Use `docker-compose.convex.yml` for self-hosted Convex backend:

```bash
docker-compose -f docker-compose.convex.yml up -d
```

## API Integration

### Agent Authentication

Agents use API keys for authentication:

```typescript
// HTTP header
Authorization: Bearer orca_key_xxx
```

Generate keys in the dashboard or via `agentKeys` table in Convex.

### Memory API

**Store Memory:**
```bash
POST /memory/store
Authorization: Bearer orca_key_xxx
Content-Type: application/json

{
  "content": "User prefers dark mode",
  "tags": ["preference", "ui"],
  "metadata": { "context": "settings" }
}
```

**Search Memories:**
```bash
POST /memory/search
Authorization: Bearer orca_key_xxx

{
  "query": "what are my preferences?",
  "limit": 10,
  "memoryType": "preference"
}
```

**Get Recent Memories:**
```bash
POST /memory/recent
Authorization: Bearer orca_key_xxx

{
  "limit": 20
}
```

See `packages/backend/convex/memory.ts` for full API and parameters.

## Available Scripts

- `bun run dev` — Start all apps in development mode
- `bun run build` — Build all apps for production
- `bun run dev:web` — Start web app (localhost:3001)
- `bun run dev:dashboard` — Start dashboard (localhost:3002)
- `bun run dev:server` — Start Convex backend
- `bun run dev:setup` — Initialize Convex project
- `bun run check` — Run Biome linting/formatting
- `bun run fix` — Auto-fix linting issues

## Contributing

Contributions are welcome. Please keep changes focused, follow the repo conventions, and include clear descriptions in PRs. If you’re adding features, update the relevant docs in [DOCS/](DOCS).

## Community

- **X (formerly Twitter):** [@orcamemoryai](https://x.com/orcamemoryai)
- **GitHub:** [Nebaura-Labs/orcamemory](https://github.com/Nebaura-Labs/orcamemory)
