import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createApiClient, type ApiClient, type ApiError, type AuthResponse } from "@us/api-client";
import { createBrowserStorage, createMemoryStorage, type TokenStorage } from "./storage";

type AuthUser = AuthResponse["user"];

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  api: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  setToken: (token: string | null) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  baseUrl: string;
  children: ReactNode;
  storage?: TokenStorage;
  onUnauthorized?: () => void;
};

const isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";

export const AuthProvider = ({ baseUrl, children, storage, onUnauthorized }: AuthProviderProps) => {
  const queryClient = useQueryClient();
  const storageRef = useRef<TokenStorage>();
  if (!storageRef.current) {
    storageRef.current = storage ?? (isBrowser() ? createBrowserStorage() : createMemoryStorage());
  }
  const resolvedStorage = storageRef.current;

  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  const client = useMemo(() => {
    return createApiClient(baseUrl, {
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        void resolvedStorage.setToken(null);
        setTokenState(null);
        setUser(null);
        queryClient.clear();
        onUnauthorized?.();
      },
    });
  }, [baseUrl, onUnauthorized, queryClient, resolvedStorage]);

  useEffect(() => {
    let active = true;
    resolvedStorage
      .getToken()
      .then((storedToken) => {
        if (!active) return;
        if (storedToken) {
          setTokenState(storedToken);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [resolvedStorage]);

  const syncToken = useCallback(
    async (nextToken: string | null, nextUser: AuthUser | null) => {
      await resolvedStorage.setToken(nextToken);
      setTokenState(nextToken);
      setUser(nextUser);
      if (!nextToken) {
        queryClient.clear();
      }
    },
    [queryClient, resolvedStorage],
  );

  const refreshMe = useCallback(async () => {
    if (!tokenRef.current) {
      setUser(null);
      return;
    }
    try {
      const me = await client.auth.me();
      setUser(me as AuthUser);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 401) {
        await syncToken(null, null);
      }
      throw error;
    }
  }, [client, syncToken]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    refreshMe().catch(() => {
      if (!cancelled) {
        // Swallow errors during boot; refreshMe already cleaned up on 401.
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshMe, token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await client.auth.login({ email, password });
      await syncToken(result.token, result.user as AuthUser);
      await queryClient.invalidateQueries();
    },
    [client, queryClient, syncToken],
  );

  const register = useCallback(
    async (payload: Record<string, unknown>) => {
      const result = await client.auth.register(payload);
      await syncToken(result.token, result.user as AuthUser);
      await queryClient.invalidateQueries();
    },
    [client, queryClient, syncToken],
  );

  const logout = useCallback(async () => {
    try {
      await client.auth.logout();
    } catch (error) {
      // ignore network errors during logout
    }
    await syncToken(null, null);
  }, [client, syncToken]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      token,
      loading,
      api: client,
      login,
      register,
      logout,
      refreshMe,
      setToken: (nextToken) => syncToken(nextToken, user),
    }),
    [client, loading, login, logout, refreshMe, register, syncToken, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export type { TokenStorage } from "./storage";
export { createBrowserStorage, createMemoryStorage } from "./storage";
