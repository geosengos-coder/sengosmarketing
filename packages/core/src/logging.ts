/**
 * Minimal structured logger. Framework-free and dependency-free: emits one JSON
 * line per event so it drops straight into any log aggregator. Swap the sink later
 * (OpenTelemetry, etc.) behind this same interface without touching call sites.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /** Returns a logger that includes `bindings` (e.g. requestId, organizationId) on every line. */
  child(bindings: LogFields): Logger;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function emit(level: LogLevel, bindings: LogFields, message: string, fields?: LogFields) {
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    message,
    ...bindings,
    ...fields,
  });
  // Route warn/error to stderr, the rest to stdout.
  if (level === "warn" || level === "error") console.error(line);
  else console.log(line);
}

export function createLogger(bindings: LogFields = {}, minLevel: LogLevel = "info"): Logger {
  const enabled = (level: LogLevel) => LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
  return {
    debug: (m, f) => enabled("debug") && emit("debug", bindings, m, f),
    info: (m, f) => enabled("info") && emit("info", bindings, m, f),
    warn: (m, f) => enabled("warn") && emit("warn", bindings, m, f),
    error: (m, f) => enabled("error") && emit("error", bindings, m, f),
    child: (extra) => createLogger({ ...bindings, ...extra }, minLevel),
  };
}

/** The root logger. Prefer `.child({ ... })` to attach request/tenant context. */
export const logger = createLogger();
