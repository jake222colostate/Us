import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";
import { useToast } from "../hooks/use-toast";

export default function Auth() {
  const { user, login, register, error, loading } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ email, password });
        push({ title: "Welcome back", variant: "success" });
      } else {
        await register({ email, password, displayName });
        push({ title: "Account created", description: "Let’s finish onboarding!", variant: "success" });
      }
    } catch (err) {
      push({ title: "Authentication failed", description: (err as Error).message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>{mode === "login" ? "Sign in" : "Create an account"}</h1>
        <p className="text-muted">
          {mode === "login"
            ? "Jump back in and sync your side-by-side matches."
            : "Tell us how to reach you and start curating your feed."}
        </p>
      </header>

      <div className="page-card auth-card">
        <div className="auth-toggle">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Sign up</button>
        </div>

        {error ? <div className="alert alert--error">{error}</div> : null}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {mode === "register" ? (
            <div className="form-field">
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </div>
          ) : null}
          <button type="submit" className="btn btn--primary" disabled={submitting || loading}>
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
