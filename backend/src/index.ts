/**
 * @operatoros/voice-gateway — long-running, stateful service (ADR-0001).
 *
 * PHASE 0: this is a skeleton. It exists to establish the deploy target and share
 * the database/core packages. The real media bridging (Twilio Media Streams <->
 * AI voice provider, barge-in, per-call state) is Phase 4 and will be built behind
 * the VoiceProvider abstraction (ADR-0002) on a bought media layer (ADR-0007).
 *
 * It deliberately does NOT run on Vercel — it holds call-length WebSockets.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8080);

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "operatoros-voice-gateway" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`voice-gateway skeleton listening on :${PORT} (Phase 0 — no media handling yet)`);
});
