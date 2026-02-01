![Orca Memory OG image](apps/web/public/og-image.png)

# Orca Memory

Open-source memory infrastructure for OpenClaw agents. Persist memories across sessions, search semantically, and maintain context over time.

- **Domain:** orcamemory.com
- **Tagline:** So your Claw remembers yesterday 🐋
- **Twitter/X:** @orcamemory (TBD)

## Docs

- Product requirements: [DOCS/PRD.md](DOCS/PRD.md)

## Rules

- PR & contribution rules: [rules/PR.md](rules/PR.md)
- Greptile review rules: [rules/GREPTILE.md](rules/GREPTILE.md)

## Core Features (MVP)

- **Memory Storage** — store memories with embeddings and metadata
- **Semantic Search** — fast vector search with filters
- **Session Logging** — audit trail, token tracking, session summaries
- **Graph Relationships** — link related memories and visualize graphs
- **Multi-Agent Support** — per-agent memory spaces with optional shared memory

## Tech Stack

- **TypeScript** — type safety and developer experience
- **TanStack Start** — SSR framework with TanStack Router
- **React** — UI components
- **Tailwind CSS** + **shadcn/ui** — styling and components
- **Convex** — real-time backend and database
- **Better Auth** — authentication
- **Ultracite/Biome** — linting and formatting
- **Turborepo** — monorepo build system

## Plans & Polar Billing

Workspace-based plans (org-level billing):

- **Surface (Free)** — $0/month
  - Projects: 1
  - Agents per project: 1
  - Tokens: 500,000
  - Searches: 5,000
  - Metadata:
    - `plan=surface`
    - `projectsLimit=1`
    - `agentsPerProjectLimit=1`
    - `tokensLimit=500000`
    - `searchesLimit=5000`
- **Tide** — $24/month
  - Projects: 10
  - Agents per project: 5
  - Tokens: 5,000,000
  - Searches: 200,000
  - Metadata:
    - `plan=tide`
    - `projectsLimit=10`
    - `agentsPerProjectLimit=5`
    - `tokensLimit=5000000`
    - `searchesLimit=200000`
- **Abyss** — $149/month
  - Projects: 50
  - Agents per project: 20
  - Tokens: 25,000,000
  - Searches: 2,000,000
  - Metadata:
    - `plan=abyss`
    - `projectsLimit=50`
    - `agentsPerProjectLimit=20`
    - `tokensLimit=25000000`
    - `searchesLimit=2000000`

Polar usage meters:
- `tokens_processed` — Count or Sum (if you send a `value` property)
- `search_queries` — Count

Polar webhook endpoint:
- `https://<convex-http-origin>/polar/events`
  - Enable events: `product.created`, `product.updated`, `subscription.created`, `subscription.updated`, `subscription.canceled`

Sync Polar products into Convex (run once after creating products):
```bash
bunx convex run polar_actions:syncProducts
```

Filters
Specify how events are filtered before they are aggregated.

Condition group, Aggregation
The function that will turn the filtered events into unit values.

- **Count** — Count the number of event occurrences
- **Sum** — Add up all values for a property
- **Average** — Take the average value for a property
- **Minimum** — Take the minimum value for a property across all event occurrences
- **Maximum** — Take the maximum value for a property across all event occurrences
- **Unique** — Count the number of unique property values

Overages (paid tiers):
- Tokens: $0.01 / 1K
- Searches: $0.10 / 1K

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Coolify Deploy Commands

Use these settings for a Coolify web deploy (repo root):

```bash
# Install
bun install

# Build
bun install && bun --cwd apps/web run build && mkdir -p apps/web/.output/server/node_modules/react-dom && cp -r apps/web/node_modules/react-dom/* apps/web/.output/server/node_modules/react-dom

# Start
bun apps/web/.output/server/index.mjs
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

## OpenClaw Plugin

Use the Orca Memory OpenClaw plugin to connect agents:

- Plugin bundle: `/plugins/orca-memory.tgz`
- Use the **Link OpenClaw agent** prompt in the dashboard to install and configure.

### Required Environment Variables

Backend (Convex):
- `SITE_URL`
- `BETTER_AUTH_SECRET`
- `POLAR_ORGANIZATION_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_SERVER` (optional, e.g. `https://api.polar.sh`)
- `POLAR_PRODUCT_SURFACE_ID`
- `POLAR_PRODUCT_TIDE_ID`
- `POLAR_PRODUCT_ABYSS_ID`
- `RESEND_CONTACTS_API_KEY`
- `RESEND_SEND_API_KEY`
- `RESEND_AUDIENCE_ID`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Frontend (web + dashboard):
- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `VITE_BKLIT_PROJECT_ID`
- `VITE_BKLIT_API_KEY`
- `VITE_BKLIT_API_HOST` (optional)
- `VITE_BKLIT_ENVIRONMENT` (optional)
- `VITE_BKLIT_DEBUG` (optional)

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

## Formatting

- Format and lint fix: `bun run check`

## Project Structure

```
orcamemory/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
├── packages/
│   ├── backend/     # Convex backend functions and schema
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run check-types`: Check TypeScript types across all apps
- `bun run check`: Run Biome formatting and linting

## Contributing

Contributions are welcome. Please keep changes focused, follow the repo conventions, and include clear descriptions in PRs. If you’re adding features, update the relevant docs in [DOCS/](DOCS).

## Community

- X (formerly Twitter): TBD
