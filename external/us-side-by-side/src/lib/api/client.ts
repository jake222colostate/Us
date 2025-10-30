export class ApiError extends Error {
  public readonly status?: number;
  public readonly data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const unauthorizedListeners = new Set<() => void>();

export const registerUnauthorizedHandler = (handler: () => void) => {
  unauthorizedListeners.add(handler);
  return () => unauthorizedListeners.delete(handler);
};

const baseUrl = (() => {
  const raw = import.meta.env.VITE_API_BASE?.trim();
  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
})();

interface RequestOptions extends RequestInit {
  parseJson?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { parseJson = true, headers, body, ...rest } = options;
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

  const finalHeaders = new Headers(headers ?? {});
  if (body && !(body instanceof FormData) && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    credentials: "include",
    ...rest,
    headers: finalHeaders,
    body,
  });

  const contentType = response.headers.get("content-type");
  const shouldParseJson = parseJson && contentType?.includes("application/json");

  let payload: unknown = undefined;
  if (shouldParseJson) {
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        throw new ApiError("Failed to parse response", response.status, text);
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedListeners.forEach((listener) => listener());
    }

    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: string }).message)
        : undefined) || response.statusText || "Request failed";

    throw new ApiError(message, response.status, payload);
  }

  return (payload as T) ?? (undefined as T);
}

export const getBaseUrl = () => baseUrl;
