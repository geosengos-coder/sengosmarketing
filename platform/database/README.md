# database

The single source of truth for the data model.

- `Prisma` schema, migrations, and seed scripts.
- A **tenant-scoped client wrapper** — the raw client is never exported.
- **Postgres Row-Level Security** policies as a hard backstop for tenant isolation.

> Scaffold only. No schema code yet. See [/docs/03_Engineering/Database_Design.md](../docs/03_Engineering/Database_Design.md).
