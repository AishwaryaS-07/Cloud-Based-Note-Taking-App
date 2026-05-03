"use client";

import { useState } from "react";
import type { AuthMode } from "@/lib/types";

type Props = {
  onSignIn(email: string, password: string): Promise<void>;
  onSignUp(email: string, password: string, displayName: string): Promise<void>;
  onGoogleSignIn(): Promise<void>;
  loading: boolean;
};

export function AuthPanel({ onSignIn, onSignUp, onGoogleSignIn, loading }: Props) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (mode === "signin") {
        await onSignIn(email, password);
      } else {
        await onSignUp(email, password, displayName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  };

  return (
    <section className="card auth-card">
      <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h2>
      <p className="muted" style={{ margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
        {mode === "signin"
          ? "Sign in to access your notes."
          : "Start capturing your ideas in seconds."}
      </p>

      <div className="auth-tabs">
        <button
          className={mode === "signin" ? "active" : ""}
          onClick={() => setMode("signin")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
          type="button"
        >
          Create account
        </button>
      </div>

      <form className="stack" onSubmit={submit}>
        {mode === "signup" && (
          <input
            className="input"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        )}
        <input
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          required
        />
        <input
          className="input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={6}
        />

        <button className="button primary" type="submit" disabled={loading} style={{ marginTop: "0.25rem" }}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>

        <div className="divider">OR</div>

        <button className="button" type="button" onClick={handleGoogle} disabled={loading}>
          Continue with Google
        </button>

        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
}
