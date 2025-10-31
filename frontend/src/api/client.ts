import { apiBase } from '../config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

type RequestOptions = Omit<RequestInit, 'method'> & {
  method?: HttpMethod;
};

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const url = `${apiBase}${normalizePath(path)}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: (body && (body.message || body.error)) || response.statusText || 'Unknown error',
      details: body,
    };
    throw error;
  }

  return (body as TResponse) ?? (undefined as TResponse);
}

export const apiClient = {
  get: <TResponse>(path: string, init?: RequestOptions) => request<TResponse>(path, { ...init, method: 'GET' }),
  post: <TResponse>(path: string, init?: RequestOptions) => request<TResponse>(path, { ...init, method: 'POST' }),
};
