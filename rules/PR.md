# PR & Contribution Rules

These rules apply to all contributions and pull requests.

## Branch Naming

- Every new feature or fix must use a dedicated branch.
- Use simple, descriptive prefixes:
  - `feat/<short-topic>` for features
  - `fix/<short-topic>` for bug fixes
  - `chore/<short-topic>` for maintenance
  - `docs/<short-topic>` for documentation
  - `refactor/<short-topic>` for refactors

## PR Scope

- Keep PRs small and focused on a single change.
- Avoid mixing unrelated fixes or refactors.
- Include the motivation and expected behavior in the description.

## Code & Quality

- Follow repo conventions and coding standards.
- Add or update tests for non-trivial logic.
- Update docs in `DOCS/` when behavior changes.
- Do not add dependencies without clear justification.

## Readiness Checklist

- ✅ Builds and tests pass
- ✅ No `console.log`, `alert`, or `debugger`
- ✅ Types are safe (avoid `any`)
- ✅ Error handling is explicit

## Review Notes

- Call out breaking changes clearly.
- Mention any follow-up work or known limitations.
