/**
 * Error Handling Utilities
 */

export class StorageError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "StorageError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "ValidationError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const prefix = context ? `[${context}]` : "";
  console.error(`${prefix} ${message}`, error);
}
