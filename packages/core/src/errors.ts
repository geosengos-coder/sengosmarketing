/**
 * Domain error hierarchy. Framework-free: these carry an HTTP status so the edge
 * (route handler) can map them to a response without the domain knowing about HTTP.
 */

export type ErrorCode =
  "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, httpStatus: number, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super("BAD_REQUEST", message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict with existing state") {
    super("CONFLICT", message, 409);
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/** Serializes any error into a safe, client-shaped payload (no internals leaked). */
export function serializeError(err: unknown): {
  code: ErrorCode;
  message: string;
  details?: unknown;
} {
  if (isAppError(err)) {
    return { code: err.code, message: err.message, details: err.details };
  }
  return { code: "INTERNAL", message: "Internal server error" };
}
