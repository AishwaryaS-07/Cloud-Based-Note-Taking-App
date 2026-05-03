"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthPanel } from "@/components/auth-panel";
import { NoteEditor } from "@/components/note-editor";
import { NoteSidebar } from "@/components/note-sidebar";
import { createStore } from "@/lib/store";
import type { AuthUser, Note, StoreAction } from "@/lib/types";

export default function Page() {
  const [store, setStore] = useState<StoreAction | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    setStore(createStore());
    setBooted(true);
  }, []);

  useEffect(() => {
    if (!store) return;
    return store.subscribe((snapshot) => {
      setUser(snapshot.user);
      setNotes(snapshot.notes);
      setActiveId((current) => current ?? snapshot.notes[0]?.id ?? null);
    });
  }, [store]);

  const activeNote = useMemo(() => notes.find((note) => note.id === activeId) ?? notes[0] ?? null, [notes, activeId]);

  const run = async (task: () => Promise<void>) => {
    setLoading(true);
    try {
      await task();
    } finally {
      setLoading(false);
    }
  };

  if (!booted) {
    return (
      <div className="shell">
        <main className="hero" style={{ placeItems: "center" }}>
          <section className="card card-pad">
            <h1 style={{ marginTop: 0 }}>Loading GlowNotes...</h1>
            <p className="muted">Preparing the workspace and checking the auth provider.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <h1>GlowNotes</h1>
            <p>Cloud-based note-taking app for Project 1</p>
          </div>
          <div className="row">
            <span className="chip">{user ? `${user.displayName} | ${user.provider}` : "Anonymous workspace"}</span>
            <span className="chip">{store ? "Connected" : "Booting"}</span>
          </div>
        </div>
      </header>

      <main className="hero">
        {!user ? (
          <div className="hero-grid">
            <AuthPanel
              loading={loading}
              onSignIn={(email, password) =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  await store.signIn(email, password);
                })
              }
              onSignUp={(email, password, displayName) =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  await store.signUp(email, password, displayName);
                })
              }
              onGoogleSignIn={() =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  await store.signInWithGoogle();
                })
              }
            />

            <section className="card card-pad stack">
              <div className="stack">
                <div className="row">
                  <span className="chip">Architecture</span>
                  <span className="chip">React + Firebase</span>
                  <span className="chip">Firestore Rules</span>
                </div>
                <h2 style={{ margin: 0, fontSize: "1.45rem" }}>A polished starter for the assignment</h2>
                <p className="muted" style={{ margin: 0 }}>
                  This build includes sign-in, note CRUD, search, tags, share toggles, and a markdown preview. If Firebase env vars are missing, it falls back to local storage so you can still use it immediately.
                </p>
              </div>

              <div className="meta-grid">
                <div className="stat">
                  <strong>{notes.length}</strong>
                  <span>Notes loaded</span>
                </div>
                <div className="stat">
                  <strong>{notes.filter((note) => note.shared).length}</strong>
                  <span>Shared notes</span>
                </div>
                <div className="stat">
                  <strong>{query ? "Filtered" : "All"}</strong>
                  <span>Search mode</span>
                </div>
              </div>

              <div className="card card-pad" style={{ background: "rgba(6, 12, 24, 0.72)" }}>
                <h3 style={{ marginTop: 0 }}>Firebase checklist</h3>
                <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--muted)", lineHeight: 1.8 }}>
                  <li>Enable Email/Password and Google sign-in in Firebase Authentication.</li>
                  <li>Create Firestore in production mode and add the notes collection rules.</li>
                  <li>Set `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, and `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.</li>
                </ol>
              </div>
            </section>
          </div>
        ) : (
          <div className="hero-grid">
            <NoteSidebar
              notes={notes}
              activeId={activeNote?.id ?? null}
              query={query}
              onQueryChange={setQuery}
              onSelect={(note) => setActiveId(note.id)}
              onCreate={() =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  const created = await store.createNote();
                  setActiveId(created.id);
                })
              }
              onDelete={(id) =>
                run(async () => {
                  if (!store) throw new Error("Store is not ready.");
                  await store.deleteNote(id);
                  if (activeId === id) {
                    setActiveId(null);
                  }
                })
              }
            />

            <NoteEditor
              note={activeNote}
              shareOwnerId={user?.uid ?? null}
              onSave={(patch) =>
                run(async () => {
                  if (!store || !activeNote) throw new Error("No note selected.");
                  await store.updateNote(activeNote.id, patch);
                })
              }
              onToggleShare={(shared, shareExpiresAt) =>
                run(async () => {
                  if (!store || !activeNote) throw new Error("No note selected.");
                  await store.toggleShare(activeNote.id, shared, shareExpiresAt);
                })
              }
            />

            <section className="card card-pad">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: 0 }}>Session</h3>
                  <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                    Signed in as {user.email}
                  </p>
                </div>
                <button
                  className="button"
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    run(async () => {
                      if (!store) throw new Error("Store is not ready.");
                      await store.signOut();
                    })
                  }
                >
                  Sign out
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
