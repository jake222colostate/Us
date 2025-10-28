import { z } from "zod";

type FetchImpl = typeof fetch;

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  retry?: number;
};

type ApiOptions = {
  getToken?: () => string | null | undefined;
  onUnauthorized?: () => void;
  fetchImpl?: FetchImpl;
  retryCount?: number;
};

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const errorSchema = z
  .object({
    message: z.string().optional(),
    error: z.string().optional(),
    details: z.unknown().optional(),
  })
  .catchall(z.unknown());

const authResponseSchema = z.object({
  token: z.string(),
  user: z.unknown(),
});

const profileSchema = z.object({
  user_id: z.string(),
  username: z.string().optional(),
  display_name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  birthdate: z.string().nullable().optional(),
  photo_urls: z.array(z.string()).optional(),
  location: z
    .object({
      latitude: z.number().nullable().optional(),
      longitude: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  radius_km: z.number().nullable().optional(),
  looking_for: z.string().nullable().optional(),
});

const postSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  photo_url: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),
  profile: profileSchema.optional(),
});

const feedResponseSchema = z.object({
  posts: z.array(postSchema).catch(() => []),
  cursor: z.string().nullable().optional(),
});

const matchSchema = z.object({
  id: z.string(),
  user_a: z.string(),
  user_b: z.string(),
  created_at: z.string().optional(),
  profile: profileSchema.optional(),
  last_message: z
    .object({
      id: z.string().optional(),
      body: z.string().optional(),
      created_at: z.string().optional(),
      sender_id: z.string().optional(),
    })
    .optional(),
});

const chatMessageSchema = z.object({
  id: z.string(),
  match_id: z.string(),
  sender_id: z.string(),
  body: z.string(),
  created_at: z.string().optional(),
});

const notificationSchema = z.object({
  id: z.string(),
  created_at: z.string().optional(),
  read: z.boolean().optional(),
  kind: z.string().optional(),
  payload: z.unknown().optional(),
});

type Parsed<T> = T extends z.ZodTypeAny ? z.infer<T> : never;

type AuthResponse = Parsed<typeof authResponseSchema>;
type Profile = Parsed<typeof profileSchema>;
type Post = Parsed<typeof postSchema>;
type FeedResponse = Parsed<typeof feedResponseSchema>;
type Match = Parsed<typeof matchSchema>;
type ChatMessage = Parsed<typeof chatMessageSchema>;
type Notification = Parsed<typeof notificationSchema>;

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  [key: string]: unknown;
};

type UpdateProfilePayload = Partial<Profile> & { user_id: string };

const parseJson = async <T>(response: Response, schema?: z.ZodType<T>): Promise<T> => {
  const text = await response.text();
  if (!text) {
    return schema ? schema.parse({}) : (undefined as T);
  }
  const data = JSON.parse(text);
  if (!schema) {
    return data as T;
  }
  return schema.parse(data);
};

const normalizeError = async (response: Response): Promise<ApiError> => {
  let message = response.statusText || "Unknown error";
  let details: unknown;
  try {
    const payload = await parseJson(response, errorSchema);
    message = (payload.message || payload.error || message).trim();
    details = payload.details ?? payload;
  } catch (error) {
    details = await response.text();
  }
  return { status: response.status, message, details };
};

export type ApiClient = ReturnType<typeof createApi>;

export function createApi(baseUrl: string, options: ApiOptions = {}) {
  const { fetchImpl: providedFetch, retryCount = 2 } = options;
  const fetcher: FetchImpl = providedFetch ?? (globalThis.fetch as FetchImpl);
  if (!fetcher) {
    throw new Error("Global fetch implementation is required to use createApi");
  }

  async function request<T>(path: string, { method = "GET", body, signal, headers = {}, retry }: RequestOptions = {}): Promise<T> {
    const attempts = retry ?? retryCount;
    const token = options.getToken?.() ?? null;

    const finalHeaders: Record<string, string> = {
      Accept: "application/json",
      ...headers,
    };

    let payload: BodyInit | undefined;
    if (body !== undefined) {
      payload = typeof body === "string" ? body : JSON.stringify(body);
      finalHeaders["Content-Type"] = finalHeaders["Content-Type"] ?? "application/json";
    }

    for (let attempt = 0; attempt <= attempts; attempt += 1) {
      const response = await fetcher(new URL(path, baseUrl).toString(), {
        method,
        body: payload,
        headers: token ? { ...finalHeaders, Authorization: `Bearer ${token}` } : finalHeaders,
        signal,
      });

      if (response.ok) {
        if (response.status === 204) {
          return undefined as T;
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return (await parseJson(response)) as T;
        }
        return (await response.text()) as T;
      }

      if (response.status === 401 || response.status === 403) {
        options.onUnauthorized?.();
        throw await normalizeError(response);
      }

      if (response.status >= 500 && attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 200));
        continue;
      }

      throw await normalizeError(response);
    }

    throw { status: 500, message: "Request failed", details: null } satisfies ApiError;
  }

  return {
    auth: {
      async login(payload: LoginPayload): Promise<AuthResponse> {
        const data = await request<AuthResponse>("/auth/login", { method: "POST", body: payload });
        return authResponseSchema.parse(data);
      },
      async logout(): Promise<void> {
        await request<void>("/auth/logout", { method: "POST" });
      },
      async register(payload: RegisterPayload): Promise<AuthResponse> {
        const data = await request<AuthResponse>("/auth/register", { method: "POST", body: payload });
        return authResponseSchema.parse(data);
      },
      async me(): Promise<AuthResponse["user"]> {
        const data = await request<AuthResponse>("/auth/me");
        const parsed = authResponseSchema.pick({ user: true }).parse(data);
        return parsed.user;
      },
    },
    users: {
      async getMe(): Promise<Profile> {
        const data = await request<Profile>("/users/me");
        return profileSchema.parse(data);
      },
      async updateMe(payload: UpdateProfilePayload): Promise<Profile> {
        const data = await request<Profile>("/users/me", { method: "PATCH", body: payload });
        return profileSchema.parse(data);
      },
      async getUser(id: string): Promise<Profile> {
        const data = await request<Profile>(`/users/${id}`);
        return profileSchema.parse(data);
      },
    },
    feed: {
      async getFeed(params?: { cursor?: string | null }): Promise<FeedResponse> {
        const search = params?.cursor ? `?cursor=${encodeURIComponent(params.cursor)}` : "";
        const data = await request<FeedResponse>(`/feed${search}`);
        return feedResponseSchema.parse(data);
      },
      async likeUser(id: string): Promise<void> {
        await request(`/feed/${id}/like`, { method: "POST" });
      },
      async passUser(id: string): Promise<void> {
        await request(`/feed/${id}/pass`, { method: "POST" });
      },
    },
    matches: {
      async list(): Promise<Match[]> {
        const data = await request<Match[]>("/matches");
        return z.array(matchSchema).parse(data);
      },
      async get(id: string): Promise<{ match: Match; messages: ChatMessage[] }> {
        const data = await request(`/matches/${id}`);
        const schema = z.object({
          match: matchSchema,
          messages: z.array(chatMessageSchema).catch(() => []),
        });
        return schema.parse(data);
      },
      async sendMessage(matchId: string, body: string): Promise<ChatMessage> {
        const data = await request<ChatMessage>(`/matches/${matchId}/messages`, {
          method: "POST",
          body: { body },
        });
        return chatMessageSchema.parse(data);
      },
    },
    notifications: {
      async list(): Promise<Notification[]> {
        const data = await request<Notification[]>("/notifications");
        return z.array(notificationSchema).parse(data);
      },
      async markRead(id: string): Promise<void> {
        await request(`/notifications/${id}/read`, { method: "POST" });
      },
    },
  };
}

export type { AuthResponse, FeedResponse, Match, Notification, Post, Profile };

