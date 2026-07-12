# packages

Shared, framework-agnostic packages consumed by both `frontend/` and `backend/`.

Planned packages:

- `core` — domain logic (employees, conversations, scheduling). No framework imports.
- `ai` — orchestration: planner, tool registry, provider adapters.
- `knowledge` — ingestion, embeddings, retrieval.
- `integrations` — connector framework + connectors.
- `ui` — design system (tokens + shadcn/ui-based components).
- `contracts` — shared Zod schemas and API types.
- `config` — shared TS/ESLint/Tailwind config.

> Scaffold only. No application code yet.
