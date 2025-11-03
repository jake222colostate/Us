const DEFAULT_BASE_URL =
  // 1) check RN-friendly global
  (typeof globalThis !== "undefined" &&
    (globalThis as any).__APP_API_BASE_URL__) ||
  // 2) Expo envs
  (typeof process !== "undefined" &&
    (process as any).env &&
    ((process as any).env.EXPO_PUBLIC_API_BASE_URL ||
      (process as any).env.API_BASE_URL)) ||
  // 3) fallback
  "/api";

export function getApiBaseUrl(): string {
  return DEFAULT_BASE_URL;
}
