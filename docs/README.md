# OperatorOS Documentation

This is the **permanent source of truth** for OperatorOS. It is written so that an engineer joining two years from now can understand the product, the architecture, and _why_ every major decision was made — without asking anyone.

If code and docs disagree, that is a bug. Fix the docs in the same change that changes the behavior.

> **Current deploy scope:** the deployed app is presently a **Phase 1** marketing/demo site with no auth, database, or dashboard at runtime. The platform architecture described throughout these docs (multi-tenant Postgres/RLS, Clerk, the dashboard) is the **Phase 2** target; its code is parked, not deleted, under [`/platform`](../platform/README.md).

## Sections

| #   | Section                            | What it answers                                                 |
| --- | ---------------------------------- | --------------------------------------------------------------- |
| 01  | [Founder Bible](01_Founder_Bible/) | Why the company exists, what it believes, and where it's going. |
| 02  | [Product](02_Product/)             | What we're building, for whom, and how it should behave.        |
| 03  | [Engineering](03_Engineering/)     | How the system is built, run, secured, and scaled.              |
| 04  | [AI](04_AI/)                       | How the AI employees think, speak, remember, and stay safe.     |
| 05  | [Design](05_Design/)               | How everything looks, moves, and feels.                         |
| 06  | [Integrations](06_Integrations/)   | How we connect to phones, calendars, CRMs, and payments.        |
| 07  | [Marketing](07_Marketing/)         | How we position, message, and go to market.                     |

## Start here

- New engineer? Read [Vision](01_Founder_Bible/Vision.md) → [Architecture](03_Engineering/Architecture.md) → [System Overview](03_Engineering/System_Overview.md) → [Database Design](03_Engineering/Database_Design.md).
- Planning? Read the [Roadmap](01_Founder_Bible/Roadmap.md).
- Making a technical decision? Read and then append to the [Decision Log](03_Engineering/Decision_Log.md).
- Building a feature? Follow **Doc-Driven Development** below.

## Authored vs. scaffold

Flagship docs carry authored content: [Vision](01_Founder_Bible/Vision.md), [Roadmap](01_Founder_Bible/Roadmap.md), [Architecture](03_Engineering/Architecture.md), [Database Design](03_Engineering/Database_Design.md), [Decision Log](03_Engineering/Decision_Log.md). The rest are 🟡 draft scaffolds — each has a tailored purpose and outline, ready to author as its phase arrives.

Every doc carries a `status` in frontmatter: 🟢 **stable** · 🟡 **draft** · 🔴 **deprecated** (link to the replacement).

## Doc-Driven Development

**No major feature is coded before its documentation exists.** Documentation leads; implementation follows.

When you build or change a feature, update these in order — enforced by the [pull request checklist](../.github/pull_request_template.md):

1. **[Roadmap](01_Founder_Bible/Roadmap.md)** — reflect the change in scope/sequence.
2. **[Feature Specifications](02_Product/Feature_Specifications.md)** — write or update the spec.
3. **[Architecture](03_Engineering/Architecture.md)** — update if the design changed.
4. **[API Strategy](03_Engineering/API_Strategy.md)** — update if endpoints or contracts changed.
5. **[Database Design](03_Engineering/Database_Design.md)** — update if the data model changed.
6. **Release notes** — record what shipped.

And whenever a notable decision is made, append an ADR to the **[Decision Log](03_Engineering/Decision_Log.md)**.

### When requirements are unclear

Stop and write the doc first. Propose the documentation update, get alignment, _then_ implement. Ambiguity resolved in prose is cheap; ambiguity resolved in production is not.

## Conventions

- **Filenames use `Underscore_Case`**; sections are numbered (`01_…07_`). No spaces in paths. (See [ADR-0006](03_Engineering/Decision_Log.md#adr-0006--documentation-folder--naming-convention-underscore-numbered-sections).)
- One concept per document. Link generously rather than duplicating.
- Prefer diagrams and tables over long prose.
- Record decisions with their **context and alternatives**, not just the outcome.
- Keep `last_updated` honest.
