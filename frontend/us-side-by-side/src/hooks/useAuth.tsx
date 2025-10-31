import * as React from "react";
import * as RRD from "react-router-dom";
import { ApiError, registerUnauthorizedHandler } from "@/lib/api/client";
import { fetchSession, login as loginEndpoint, logout as logoutEndpoint, refreshSession, signup as signupEndpoint } from "@/lib/api/endpoints";
import type { ApiUser } from "@/lib/api/types";

function _navigate(to: string, opts?: { replace?: boolean; state?: any }) {
  if (opts?.replace) window.history.replaceState(opts.state ?? {}, "", to);
  else window.history.pushState(opts.state ?? {}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

interface AuthContextValue {
  user: ApiUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const location = RRD.useLocation();
  const [user, setUser] = React.useState<ApiUser | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadSession = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const sessionUser = await fetchSession();
      setUser(sessionUser);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load session");
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadSession(); }, [loadSession]);

  React.useEffect(() => {
    const unsubscribe = registerUnauthorizedHandler(() => {
      setUser(null);
      if (location.pathname !== "/auth") _navigate("/auth", { replace: true, state: { from: location } });
    });
    return unsubscribe;
  }, [location]);

  const login = React.useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginEndpoint(email, password);
      setUser(loggedInUser); setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed"); throw err;
    } finally { setIsLoading(false); }
  }, []);

  const signup = React.useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const newUser = await signupEndpoint(name, email, password);
      setUser(newUser); setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed"); throw err;
    } finally { setIsLoading(false); }
  }, []);

  const logout = React.useCallback(async () => {
    setIsLoading(true);
    try { await logoutEndpoint(); }
    catch (err) { setError(err instanceof Error ? err.message : "Logout failed"); }
    finally { setUser(null); setIsLoading(false); _navigate("/auth", { replace: true }); }
  }, []);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    try { const refreshed = await refreshSession(); setUser(refreshed); setError(null); }
    catch (err) {
      if (err instanceof ApiError && err.status === 401) { setUser(null); setError(null); }
      else { setError(err instanceof Error ? err.message : "Session refresh failed"); }
      throw err;
    } finally { setIsLoading(false); }
  }, []);

  const value = React.useMemo(() => ({ user, isLoading, error, login, signup, logout, refresh }), [user, isLoading, error, login, signup, logout, refresh]);
  return React.createElement(AuthContext.Provider, { value }, children as any);
};

export const useAuth = () => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
