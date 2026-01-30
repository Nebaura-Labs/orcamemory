# Greptile Review Rules

These rules guide Greptile when analyzing PRs in this repository. Focus on correctness, clarity, and alignment with Orca Memory’s architecture and standards.

## Scope

- Review changes only within the PR diff.
- Prioritize user-facing issues, data integrity, and security.
- Flag risky changes to auth, permissions, or data models.

## Code Quality

- Ensure types are explicit where they improve clarity.
- Prefer `const` over `let`; avoid `any`.
- Use `async/await` consistently and handle errors thoughtfully.
- Avoid unnecessary abstraction; keep logic readable.

## Architecture & Standards

- Monorepo layout: `apps/*` for apps, `packages/*` for shared code.
- Keep backend logic in `packages/backend` and web UI in `apps/web`.
- Use existing patterns for Convex functions and Better Auth integration.
- Avoid adding new dependencies unless clearly justified.

## Frontend

- Use semantic HTML and accessible components.
- Ensure loading and error states are handled.
- Avoid `console.log`, `alert`, and `debugger` in production code.

## Backend

- Validate inputs with `zod` or Convex validators.
- Avoid breaking schema changes without migrations or clear notes.
- Ensure auth checks are present for protected actions.
- Confirm vector search usage aligns with memory query requirements.

## Docs & DX

- Update docs in `DOCS/` when behavior or APIs change.
- Keep README accurate for setup and scripts.
- Prefer short, actionable PR descriptions.

## Testing

- Add or update tests for non-trivial logic.
- Ensure existing tests remain valid.

## Output Expectations

- Summarize risks and required fixes first.
- Call out optional improvements separately.
- Provide concise, actionable feedback.
