/**
 * Placeholder root. The marketing site (Phase 1) and dashboard (Phase 2) replace
 * this. Kept intentionally minimal — Phase 0 ships the platform spine, not UI.
 */
export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "4rem", maxWidth: 640 }}>
      <h1>OperatorOS</h1>
      <p>The operating system for AI Employees.</p>
      <p style={{ color: "#666" }}>
        Phase 0 — foundation. Product surfaces arrive in later phases.
      </p>
    </main>
  );
}
