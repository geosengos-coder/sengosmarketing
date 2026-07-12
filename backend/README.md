# backend

Long-running backend services that cannot run on serverless — chiefly the **voice gateway**.

- `voice-gateway`: holds Twilio Media Stream + AI provider WebSockets for the duration of a call, manages per-call state, barge-in, and latency. Deployed as a container (Fly.io/Railway/Render), near Twilio's media region.
- Shares the database schema and domain logic via `database/` and `packages/`.

> Scaffold only. No application code yet. See [/docs/04_AI/Voice_Architecture.md](../docs/04_AI/Voice_Architecture.md).
