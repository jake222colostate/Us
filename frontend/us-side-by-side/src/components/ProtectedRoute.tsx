import * as React from "react";
import * as RRD from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, error } = useAuth();
  const location = RRD.useLocation();

  if (isLoading) {
    return React.createElement(
      "div",
      { className: "flex min-h-screen items-center justify-center" },
      React.createElement("div", { className: "animate-pulse text-lg text-muted-foreground" }, "Loading…"),
    );
  }

  if (!user) {
    return React.createElement(RRD.Navigate, { to: "/auth", replace: true, state: { from: location, error } });
  }

  return React.createElement(React.Fragment, null, children as any);
};
