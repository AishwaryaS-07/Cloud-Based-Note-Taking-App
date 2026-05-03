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

  return (
    <section className="card card-pad auth-box">
      <div className="stack">
        <div className="row">
          <span className="chip">Firebase Auth</span>
          <span className="chip">Email + Google</span>
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Sign in to your workspace</h2>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Use the Firebase-backed flow when credentials are set, or the local demo mode when you just want to explore the app.
          </p>
        </div>
      </div>

      <div className="auth-tabs">
        <button className={`button ${mode === "signin" ? "primary" : "ghost"}`} onClick={() => setMode("signin")} type="button">
          Sign in
        </button>
        <button className={`button ${mode === "signup" ? "primary" : "ghost"}`} onClick={() => setMode("signup")} type="button">
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
          />
        )}
        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
        />
        <input
          className="input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />

        <div className="grid-2">
          <button className="button primary" type="submit" disabled={loading}>
            {loading ? "Working..." : mode === "signin" ? "Enter workspace" : "Create account"}
          </button>
          <button className="button" type="button" onClick={onGoogleSignIn} disabled={loading}>
            Continue with Google
          </button>
        </div>
        {error ? <p style={{ margin: 0, color: "var(--danger)" }}>{error}</p> : null}
      </form>
    </section>
  );
}
