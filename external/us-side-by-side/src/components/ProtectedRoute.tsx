import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading, error } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location, error }} />;
  }

  return <>{children}</>;
};
