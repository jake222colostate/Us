import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ApiError, registerUnauthorizedHandler } from "@/lib/api/client";
import {
  fetchSession,
  login as loginEndpoint,
  logout as logoutEndpoint,
  refreshSession,
  signup as signupEndpoint,
} from "@/lib/api/endpoints";
import type { ApiUser } from "@/lib/api/types";

interface AuthContextValue {
  user: ApiUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const sessionUser = await fetchSession();
      setUser(sessionUser);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setError(null);
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load session");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    const unsubscribe = registerUnauthorizedHandler(() => {
      setUser(null);
      if (location.pathname !== "/auth") {
        navigate("/auth", {
          replace: true,
          state: { from: location },
        });
      }
    });
    return unsubscribe;
  }, [navigate, location]);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const loggedInUser = await loginEndpoint(email, password);
        setUser(loggedInUser);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const newUser = await signupEndpoint(name, email, password);
        setUser(newUser);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Signup failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await logoutEndpoint();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setUser(null);
      setIsLoading(false);
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const refreshedUser = await refreshSession();
      setUser(refreshedUser);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : "Session refresh failed");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, error, login, signup, logout, refresh }),
    [error, isLoading, login, logout, refresh, signup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
