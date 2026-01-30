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

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

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
