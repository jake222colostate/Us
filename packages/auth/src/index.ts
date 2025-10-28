import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

type User = { id: string; name?: string; email?: string } | null;
type AuthContextType = {
  user: User;
  token: string | null;
  login: (token: string, user?: User) => void;
  logout: () => void;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("us.auth.token");
      const u = localStorage.getItem("us.auth.user");
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
    } catch {}
  }, []);

  const login = (t: string, u?: User) => {
    setToken(t);
    if (u !== undefined) setUser(u);
    try {
      localStorage.setItem("us.auth.token", t);
      if (u !== undefined) localStorage.setItem("us.auth.user", JSON.stringify(u));
    } catch {}
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem("us.auth.token");
      localStorage.removeItem("us.auth.user");
    } catch {}
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
