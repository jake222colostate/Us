const DEFAULT_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && (process as any).env?.VITE_API_BASE_URL) ||
  "/api";

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

export type ApiClientOptions = {
  getToken?: () => string | null | undefined;
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
};

export type RequestParams = Record<string, string | number | boolean | null | undefined>;

export type RequestConfig = {
  method?: string;
  body?: BodyInit | Record<string, unknown> | undefined | null;
  headers?: Record<string, string>;
  params?: RequestParams;
};

export type AuthUser = {
  id: string;
  email: string;
  display_name?: string | null;
  displayName?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  [key: string]: unknown;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type ApiClient = {
  baseUrl: string;
  request: <T>(path: string, config?: RequestConfig) => Promise<T>;
  auth: {
    login: (payload: Record<string, unknown>) => Promise<AuthResponse>;
    register: (payload: Record<string, unknown>) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    me: () => Promise<AuthUser>;
  };
};

function buildUrl(baseUrl: string, path: string, params?: RequestParams): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const query = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      query.append(key, String(value));
    });
  }

  const queryString = query.toString();
  return `${normalizedBase}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
}

function isJsonLike(body: BodyInit | Record<string, unknown> | undefined | null): body is Record<string, unknown> {
  return !!body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob);
}

function resolveMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const anyData = data as Record<string, unknown>;
    if (typeof anyData.message === "string" && anyData.message.trim()) {
      return anyData.message;
    }
    if (typeof anyData.error === "string" && anyData.error.trim()) {
      return anyData.error;
    }
  }
  if (typeof data === "string" && data.trim()) {
    return data;
  }
  return fallback;
}

export function createApiClient(baseUrl = DEFAULT_BASE_URL, options: ApiClientOptions = {}): ApiClient {
  const { getToken, onUnauthorized, fetchImpl } = options;
  const fetchFn: typeof fetch = fetchImpl ?? (globalThis.fetch as typeof fetch);
  if (typeof fetchFn !== "function") {
    throw new Error("Global fetch is not available. Provide a fetch implementation in ApiClientOptions.fetchImpl.");
  }

  const request = async <T>(path: string, config: RequestConfig = {}): Promise<T> => {
    const { method = "GET", body, headers = {}, params } = config;
    const url = buildUrl(baseUrl, path, params);

    const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
    let finalBody = body ?? undefined;

    if (isJsonLike(body)) {
      finalHeaders["content-type"] = "application/json";
      finalBody = JSON.stringify(body);
    }

    const token = getToken?.();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetchFn(url, {
        method,
        headers: finalHeaders,
        body: finalBody ?? undefined,
      });
    } catch (error) {
      throw new ApiError((error as Error)?.message ?? "Network request failed", 0, error);
    }

    const contentType = response.headers.get("content-type") || "";
    const isJsonResponse = contentType.includes("application/json");
    let responseData: unknown = null;

    if (response.status !== 204) {
      const raw = await response.text();
      if (raw) {
        if (isJsonResponse) {
          try {
            responseData = JSON.parse(raw);
          } catch {
            responseData = raw;
          }
        } else {
          responseData = raw;
        }
      }
    }

    if (!response.ok) {
      const message = resolveMessage(responseData, `${response.status} ${response.statusText || "Request failed"}`);
      const error = new ApiError(message, response.status, responseData);
      if (response.status === 401) {
        onUnauthorized?.();
      }
      throw error;
    }

    return (responseData ?? (undefined as unknown)) as T;
  };

  return {
    baseUrl,
    request,
    auth: {
      login: (payload: Record<string, unknown>) => request<AuthResponse>("/auth/login", { method: "POST", body: payload }),
      register: (payload: Record<string, unknown>) => request<AuthResponse>("/auth/register", { method: "POST", body: payload }),
      logout: () => request<void>("/auth/logout", { method: "POST" }),
      me: () => request<AuthUser>("/auth/me"),
    },
  };
}

export const api = createApiClient();

export { DEFAULT_BASE_URL as API_BASE };
