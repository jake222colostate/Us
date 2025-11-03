import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { ENABLE_DEMO_DATA } from "./config";
import { demoProfile } from "./lib/demo-data";
import type { AuthResponse, AuthUser } from "./types";
import { ApiError, normalizeError } from "./api/client";
import { getSupabaseClient } from "./api/supabase";
import { ensureProfile } from "./api/profile";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login(input: { email: string; password: string }): Promise<AuthUser>;
  register(input: { email: string; password: string; displayName?: string; birthdate?: string }): Promise<AuthUser>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  setAuthUser(user: AuthUser | null): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const demoUser: AuthUser = {
  id: demoProfile.user_id,
  email: "demo@us.app",
  displayName: demoProfile.display_name,
  avatarUrl: demoProfile.photos[0]?.url ?? null,
};

function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  const displayName = (metadata.display_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    (user.email ? user.email.split("@")[0] : undefined);
  const avatarUrl = (metadata.avatar_url as string | undefined) ?? null;
  return {
    id: user.id,
    email: user.email ?? "",
    displayName: displayName ?? undefined,
    avatarUrl,
  };
}

async function extractSessionUser(session: Session | null): Promise<AuthResponse | null> {
  if (!session?.user) return null;
  const baseUser = mapSupabaseUser(session.user);
  if (!baseUser) return null;
  return {
    user: baseUser,
    token: session.access_token ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const syncFromSession = useCallback(
    async (session: Session | null) => {
      if (!supabase) {
        if (ENABLE_DEMO_DATA) {
          setUser(demoUser);
          setToken(null);
        } else {
          setUser(null);
          setToken(null);
        }
        return;
      }

      const response = await extractSessionUser(session);
      if (!response?.user) {
        setUser(null);
        setToken(null);
        return;
      }

      setUser(response.user);
      setToken(response.token ?? null);

      try {
        const sessionUser = session?.user;
        if (sessionUser) {
          const profile = await ensureProfile({
            userId: sessionUser.id,
            email: sessionUser.email,
            displayName: (sessionUser.user_metadata?.display_name as string | undefined) ?? response.user.displayName ?? null,
            birthdate: (sessionUser.user_metadata?.birthdate as string | undefined) ?? null,
          });
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  displayName: profile.display_name ?? prev.displayName,
                  avatarUrl:
                    profile.photos?.find((photo) => photo.is_primary)?.url ??
                    profile.photos?.[0]?.url ??
                    prev.avatarUrl ??
                    null,
                }
              : prev
          );
        }
      } catch (err) {
        if (!ENABLE_DEMO_DATA) {
          setError(normalizeError(err).message);
        }
      }
    },
    [supabase]
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!supabase) {
        if (ENABLE_DEMO_DATA) {
          setUser(demoUser);
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(sessionError.message);
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      if (!cancelled) {
        await syncFromSession(data.session);
        setLoading(false);
      }
    }

    hydrate();

    if (!supabase) {
      return () => {
        cancelled = true;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      syncFromSession(newSession);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase, syncFromSession]);

  const login = useCallback<AuthContextValue["login"]>(
    async ({ email, password }) => {
      if (!supabase) {
        if (ENABLE_DEMO_DATA) {
          setUser(demoUser);
          setToken(null);
          return demoUser;
        }
        throw new ApiError("Authentication is unavailable", 503, null);
      }

      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        throw normalizeError(authError, authError.status ?? 400);
      }
      await syncFromSession(data.session ?? null);
      const authUser = mapSupabaseUser(data.session?.user ?? null);
      if (!authUser) {
        throw new ApiError("Login failed", 401, null);
      }
      return authUser;
    },
    [supabase, syncFromSession]
  );

  const register = useCallback<AuthContextValue["register"]>(
    async ({ email, password, displayName, birthdate }) => {
      if (!supabase) {
        if (ENABLE_DEMO_DATA) {
          const fallback = { ...demoUser, email, displayName: displayName ?? demoUser.displayName };
          setUser(fallback);
          setToken(null);
          return fallback;
        }
        throw new ApiError("Registration is unavailable", 503, null);
      }

      setError(null);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            birthdate: birthdate ?? null,
          },
        },
      });

      if (signUpError) {
        throw normalizeError(signUpError, signUpError.status ?? 400);
      }

      const session = data.session ?? (await supabase.auth.getSession()).data.session ?? null;
      await syncFromSession(session);

      const authUser = mapSupabaseUser(session?.user ?? null);
      if (!authUser) {
        throw new ApiError("Registration requires email confirmation. Check your inbox to complete the process.", 202, null);
      }
      return authUser;
    },
    [supabase, syncFromSession]
  );

  const logout = useCallback(async () => {
    if (!supabase) {
      setUser(null);
      setToken(null);
      return;
    }
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(normalizeError(signOutError).message);
    }
    setUser(null);
    setToken(null);
  }, [supabase]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setError(sessionError.message);
      return;
    }
    await syncFromSession(data.session);
  }, [supabase, syncFromSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      refresh,
      setAuthUser: (next) => {
        setUser(next);
      },
    }),
    [user, token, loading, error, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
