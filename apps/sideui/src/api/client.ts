export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function normalizeError(error: unknown, fallbackStatus = 500): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error && typeof error === "object") {
    const anyError = error as Record<string, unknown>;
    if (typeof anyError.message === "string") {
      const rawStatus = anyError.status ?? anyError.statusCode ?? anyError.code;
      const statusNumber = typeof rawStatus === "number" ? rawStatus : Number(rawStatus);
      return new ApiError(anyError.message, Number.isFinite(statusNumber) ? Number(statusNumber) : fallbackStatus, error);
    }
  }

  if (error instanceof Error) {
    return new ApiError(error.message, fallbackStatus, error);
  }

  return new ApiError("Unknown error", fallbackStatus, error);
}
