export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string | null): Promise<void>;
}

const MEMORY_KEY = Symbol("us.auth.memory");

type MemoryState = {
  token: string | null;
};

const globalMemory = globalThis as typeof globalThis & { [MEMORY_KEY]?: MemoryState };

export const createMemoryStorage = (): TokenStorage => {
  if (!globalMemory[MEMORY_KEY]) {
    globalMemory[MEMORY_KEY] = { token: null };
  }
  return {
    async getToken() {
      return globalMemory[MEMORY_KEY]!.token;
    },
    async setToken(token) {
      globalMemory[MEMORY_KEY]!.token = token ?? null;
    },
  };
};

const DEFAULT_BROWSER_KEY = "us.auth.token";

export const createBrowserStorage = (key = DEFAULT_BROWSER_KEY): TokenStorage => ({
  async getToken() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  async setToken(token) {
    if (typeof window === "undefined") return;
    if (token) {
      window.localStorage.setItem(key, token);
    } else {
      window.localStorage.removeItem(key);
    }
  },
});

